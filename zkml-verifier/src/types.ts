/**
 * ZKML Verifier Types
 */

export interface EZKLProof {
  proof: string | object;
  instances: string[][];
}

export interface ProofPublicInputs {
  employee_id: string;
  threshold: number;
  txids: string[];
  history_commitment: string;
}

export interface VerifyProofRequest {
  proof: EZKLProof;
  publicInputs: ProofPublicInputs;
}

export interface Attestation {
  employee_id: string;
  threshold: string;
  txids: string[];
  history_commitment: string;
  timestamp: number;
  attestation_hash: string;
  // verifier_secret is NEVER exposed - removed for security
  verifier_pubkey: string;
}

export interface VerifyProofResponse {
  success: boolean;
  attestation?: Attestation;
  error?: string;
  message?: string;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  service: string;
  timestamp: number;
  verifier_pubkey: string;
  ezkl_available: boolean;
}
