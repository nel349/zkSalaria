/**
 * Type definitions for ZKML verifier service responses
 * Inlined to avoid cyclic dependency with @zksalaria/zkml-verifier
 */

export interface GenerateProofResponse {
  success: boolean;
  proof_json?: string;  // The actual EZKL proof
  attestation?: {
    verifier_address: string;
    proof_hash: string;
    timestamp: number;
    signature?: string;
  };
  error?: string;  // General error category (for backwards compatibility)
  error_code?: string;  // Specific error code for UI handling
  message?: string;  // Human-readable message
  duration?: number;
}
