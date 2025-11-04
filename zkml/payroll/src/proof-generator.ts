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
const EZKL_PATH = process.env.EZKL_PATH || '/Users/norman/.ezkl/ezkl';

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

      // Write input data
      await writeFile(inputFile, JSON.stringify({ input_data: [inputData] }, null, 2));

      // Step 1: Generate witness
      await execAsync(
        `${EZKL_PATH} gen-witness -M ${modelPaths.compiled} -D ${inputFile} -O ${witnessFile}`,
        { timeout: 60000 }
      );

      // Step 2: Generate proof
      await execAsync(
        `${EZKL_PATH} prove -M ${modelPaths.compiled} -W ${witnessFile} --pk-path ${modelPaths.pk} --proof-path ${proofFile}`,
        { timeout: 120000 }
      );

      // Read the generated proof
      const { readFile } = await import('fs/promises');
      const proofJson = await readFile(proofFile, 'utf-8');

      const result: ProofOutput = {
        proofType,
        proofJson,
        publicInputs: {
          result: true, // Will be determined by verification
          payments: input.payments,
          thresholdMin: input.thresholdMin,
          thresholdMax: input.thresholdMax
        }
      };

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
    if (!input.payments || input.payments.length !== 12) {
      throw new Error('Exactly 12 monthly payments required');
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
   */
  private prepareInputData(proofType: ProofType, input: ProofInput): number[] {
    const { payments, thresholdMin, thresholdMax } = input;

    switch (proofType) {
      case ProofType.INCOME_ABOVE_THRESHOLD:
      case ProofType.AVERAGE_INCOME:
      case ProofType.CREDIT_SCORE:
        return [...payments, thresholdMin];

      case ProofType.INCOME_RANGE:
        if (!thresholdMax) {
          throw new Error('INCOME_RANGE requires thresholdMax');
        }
        return [...payments, thresholdMin, thresholdMax];

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
