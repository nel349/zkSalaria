/**
 * ZKML Proof Verifier
 *
 * Verifies zero-knowledge proofs using EZKL verification keys
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import {
  ProofType,
  ProofOutput,
  ProofVerificationResult,
  MODEL_CONFIGS
} from './types';

const execAsync = promisify(exec);
const VERIFY_SCRIPT = join(__dirname, '..', 'verify_proof.py');
const SRS_PATH = join(__dirname, '..', 'kzg.srs');

export class ProofVerifier {
  private workDir: string;

  constructor(workDir: string = '/tmp/zkml-verify') {
    this.workDir = workDir;
  }

  /**
   * Verify a zero-knowledge proof
   */
  async verifyProof(proof: ProofOutput): Promise<ProofVerificationResult> {
    const startTime = Date.now();

    try {
      // Get model paths
      const modelPaths = MODEL_CONFIGS[proof.proofType];

      // Create work directory
      await mkdir(this.workDir, { recursive: true });

      // Write proof to temporary file
      const proofFile = join(this.workDir, `proof_verify_${Date.now()}.json`);
      await writeFile(proofFile, proof.proofJson);

      // Verify using Python EZKL API
      const { stdout } = await execAsync(
        `uv run python ${VERIFY_SCRIPT} ${proofFile} ${modelPaths.settings} ${modelPaths.vk} ${SRS_PATH}`,
        { timeout: 60000, cwd: join(__dirname, '..') }
      );

      const result = JSON.parse(stdout.trim());
      const verified = result.verified === true;

      return {
        success: true,
        verified,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
    }
  }
}

/**
 * Convenience function to verify a proof
 */
export async function verifyIncomeProof(
  proof: ProofOutput
): Promise<ProofVerificationResult> {
  const verifier = new ProofVerifier();
  return verifier.verifyProof(proof);
}
