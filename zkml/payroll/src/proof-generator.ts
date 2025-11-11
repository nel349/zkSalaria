/**
 * ZKML Proof Generator
 *
 * Handles the complete workflow for generating zero-knowledge proofs:
 * 1. Validate input data
 * 2. Generate witness from ONNX model
 * 3. Create ZK proof using EZKL
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import {
  ProofType,
  ProofInput,
  ProofOutput,
  ProofGenerationResult,
  MODEL_CONFIGS
} from './types';

const execAsync = promisify(exec);
const GENERATE_SCRIPT = join(__dirname, '..', 'generate_proof.py');

export class ProofGenerator {
  private workDir: string;

  constructor(workDir: string = '/tmp/zkml-proofs') {
    this.workDir = workDir;
  }

  /**
   * Generate a zero-knowledge proof for income verification
   */
  async generateProof(
    proofType: ProofType,
    input: ProofInput
  ): Promise<ProofGenerationResult> {
    const startTime = Date.now();

    try {
      // Validate input
      this.validateInput(proofType, input);

      // Get model paths
      const modelPaths = MODEL_CONFIGS[proofType];
      const modelDir = dirname(modelPaths.compiled);

      // Prepare input data
      const inputData = this.prepareInputData(proofType, input);

      // Create work directory
      await mkdir(this.workDir, { recursive: true });

      // File paths for this proof generation
      const inputFile = join(this.workDir, `input_${Date.now()}.json`);
      const witnessFile = join(this.workDir, `witness_${Date.now()}.json`);
      const proofFile = join(this.workDir, `proof_${Date.now()}.json`);

      // Write input data in EZKL format
      // Convert [v1, v2, v3, ...] to [[v1], [v2], [v3], ...]
      const ezklInput = {
        input_shapes: inputData.map(() => [1]),
        input_data: inputData.map(v => [v])
      };
      await writeFile(inputFile, JSON.stringify(ezklInput, null, 2));

      // Generate witness and proof using Python EZKL API
      await execAsync(
        `uv run python ${GENERATE_SCRIPT} ${modelPaths.onnx} ${modelPaths.compiled} ${modelPaths.pk} ${inputFile} ${witnessFile} ${proofFile}`,
        { timeout: 120000, cwd: join(__dirname, '..') }
      );

      // Read the generated proof
      const { readFile } = await import('fs/promises');
      const proofJson = await readFile(proofFile, 'utf-8');

      // Read the witness to get the actual ZKML model output
      const witnessJson = await readFile(witnessFile, 'utf-8');
      const witness = JSON.parse(witnessJson);

      // Parse the result from witness outputs
      // outputs is an array like [["0100000000..."]] where first 2 hex chars indicate 0 or 1
      const outputHex = witness.outputs?.[0]?.[0] || '00';

      // Different proof types have different output formats:
      // - INCOME_ABOVE_THRESHOLD, INCOME_RANGE, AVERAGE_INCOME: boolean (01 = true, 00 = false)
      // - FIRST_TIME_LOAN_ELIGIBILITY: number (average income if consistent, 0 if not)
      let zkmlResult: boolean;
      if (proofType === ProofType.FIRST_TIME_LOAN_ELIGIBILITY) {
        // For first-time loan, output is a number. Check if it's > 0
        // Parse hex to integer and check if non-zero
        const outputValue = parseInt(outputHex.substring(0, 8), 16);
        zkmlResult = outputValue > 0;
      } else {
        // For other proof types, check if first 2 chars are '01'
        zkmlResult = outputHex.substring(0, 2) === '01';
      }

      const result: ProofOutput = {
        proofType,
        proofJson,
        publicInputs: {
          result: zkmlResult, // Actual result from ZKML model
          payments: input.payments,
          thresholdMin: input.thresholdMin,
          thresholdMax: input.thresholdMax
        }
      };

      // If ZKML result is false, the proof should fail
      if (!zkmlResult) {
        return {
          success: false,
          error: 'Income does not meet the specified threshold',
          duration: Date.now() - startTime
        };
      }

      return {
        success: true,
        proof: result,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Validate input data
   */
  private validateInput(proofType: ProofType, input: ProofInput): void {
    if (!input.payments || input.payments.length !== 6) {
      throw new Error('Exactly 6 monthly payments required');
    }

    if (input.payments.some(p => p < 0)) {
      throw new Error('Payment amounts cannot be negative');
    }

    if (input.thresholdMin < 0) {
      throw new Error('Threshold cannot be negative');
    }

    if (proofType === ProofType.INCOME_RANGE) {
      if (!input.thresholdMax) {
        throw new Error('INCOME_RANGE requires thresholdMax');
      }
      if (input.thresholdMax <= input.thresholdMin) {
        throw new Error('thresholdMax must be greater than thresholdMin');
      }
    }
  }

  /**
   * Prepare input data array for ONNX model
   * CRITICAL: ALL values must be normalized by dividing by 10000
   * because all models use input_scale: 7 to prevent EZKL overflow
   */
  private prepareInputData(proofType: ProofType, input: ProofInput): number[] {
    const { payments, thresholdMin, thresholdMax } = input;
    const NORMALIZATION_FACTOR = 10000;

    // Normalize all payment amounts
    const normalizedPayments = payments.map(p => p / NORMALIZATION_FACTOR);

    switch (proofType) {
      case ProofType.INCOME_ABOVE_THRESHOLD:
      case ProofType.AVERAGE_INCOME:
        // Normalize threshold
        return [...normalizedPayments, thresholdMin / NORMALIZATION_FACTOR];

      case ProofType.FIRST_TIME_LOAN_ELIGIBILITY:
        // Threshold is already a ratio (0-1), no normalization needed
        return [...normalizedPayments, thresholdMin];

      case ProofType.INCOME_RANGE:
        if (!thresholdMax) {
          throw new Error('INCOME_RANGE requires thresholdMax');
        }
        // Normalize both thresholds
        return [...normalizedPayments, thresholdMin / NORMALIZATION_FACTOR, thresholdMax / NORMALIZATION_FACTOR];

      default:
        throw new Error(`Unknown proof type: ${proofType}`);
    }
  }
}

/**
 * Convenience function to generate a proof
 */
export async function generateIncomeProof(
  proofType: ProofType,
  payments: number[],
  thresholdMin: number,
  thresholdMax?: number
): Promise<ProofGenerationResult> {
  const generator = new ProofGenerator();
  return generator.generateProof(proofType, {
    payments,
    thresholdMin,
    thresholdMax
  });
}
