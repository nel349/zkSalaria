/**
 * ZKML Verifier Types
 */

export interface EZKLProof {
  proof: string | object;
  instances: string[][];
}

export enum ProofType {
  INCOME_ABOVE_THRESHOLD = 1,
  INCOME_RANGE = 2,
  AVERAGE_INCOME = 3,
  CREDIT_SCORE = 4,
  TAX_BRACKET = 5
}

export interface ProofPublicInputs {
  employee_id: string;
  proof_type: number;
  threshold: number;
  threshold_max?: number;
  txids: string[];
  history_commitment: string;
}

export interface GenerateProofRequest {
  proof_type: ProofType;
  payments: number[];  // 6 monthly payments
  threshold_min: number;
  threshold_max?: number;  // Only for INCOME_RANGE
  employee_id: string;
  txids: string[];
  history_commitment: string;
  contract_address: string;  // Contract address to submit proof to
}

export enum ErrorCode {
  THRESHOLD_NOT_MET = 'THRESHOLD_NOT_MET',          // Income doesn't meet requirements (legitimate failure)
  PROOF_GENERATION_FAILED = 'PROOF_GENERATION_FAILED', // EZKL technical error
  VALIDATION_ERROR = 'VALIDATION_ERROR',            // Invalid input data
  INTERNAL_ERROR = 'INTERNAL_ERROR'                 // Unexpected server error
}

export interface GenerateProofResponse {
  success: boolean;
  proof_json?: string;  // The actual EZKL proof
  attestation?: Attestation;
  error?: string;  // General error category (for backwards compatibility)
  error_code?: ErrorCode;  // Specific error code for UI handling
  message?: string;  // Human-readable message
  duration?: number;
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
