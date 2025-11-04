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
const EZKL_PATH = process.env.EZKL_PATH || '/Users/norman/.ezkl/ezkl';

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

      // Verify using EZKL
      const { stdout } = await execAsync(
        `${EZKL_PATH} verify --proof-path ${proofFile} --settings-path ${modelPaths.settings} --vk-path ${modelPaths.vk}`,
        { timeout: 60000 }
      );

      const verified = stdout.includes('verified: true');

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
