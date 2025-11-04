/**
 * Type definitions for ZKML income proofs
 */

export enum ProofType {
  INCOME_ABOVE_THRESHOLD = 1,
  INCOME_RANGE = 2,
  AVERAGE_INCOME = 3,
  CREDIT_SCORE = 4
}

export interface ProofInput {
  payments: number[];  // Exactly 12 monthly payment amounts
  thresholdMin: number;
  thresholdMax?: number;  // Only for INCOME_RANGE
}

export interface ProofOutput {
  proofType: ProofType;
  proofJson: string;  // The actual EZKL proof
  publicInputs: {
    result: boolean;  // Did the proof pass?
    payments: number[];
    thresholdMin: number;
    thresholdMax?: number;
  };
}

export interface ProofGenerationResult {
  success: boolean;
  proof?: ProofOutput;
  error?: string;
  duration: number;
}

export interface ProofVerificationResult {
  success: boolean;
  verified: boolean;
  error?: string;
  duration: number;
}

export interface ModelPaths {
  onnx: string;
  compiled: string;
  pk: string;
  vk: string;
  settings: string;
}

import { join } from 'path';

// Get the absolute path to the payroll directory
const PAYROLL_DIR = join(__dirname, '..');

export const MODEL_CONFIGS: Record<ProofType, ModelPaths> = {
  [ProofType.INCOME_ABOVE_THRESHOLD]: {
    onnx: join(PAYROLL_DIR, 'income_above_threshold/income_above_threshold.onnx'),
    compiled: join(PAYROLL_DIR, 'income_above_threshold/income_above_threshold.compiled'),
    pk: join(PAYROLL_DIR, 'income_above_threshold/income_above_threshold_pk.key'),
    vk: join(PAYROLL_DIR, 'income_above_threshold/income_above_threshold_vk.key'),
    settings: join(PAYROLL_DIR, 'income_above_threshold/income_above_threshold_settings.json')
  },
  [ProofType.INCOME_RANGE]: {
    onnx: join(PAYROLL_DIR, 'income_range/income_range.onnx'),
    compiled: join(PAYROLL_DIR, 'income_range/income_range.compiled'),
    pk: join(PAYROLL_DIR, 'income_range/income_range_pk.key'),
    vk: join(PAYROLL_DIR, 'income_range/income_range_vk.key'),
    settings: join(PAYROLL_DIR, 'income_range/income_range_settings.json')
  },
  [ProofType.AVERAGE_INCOME]: {
    onnx: join(PAYROLL_DIR, 'average_income/average_income.onnx'),
    compiled: join(PAYROLL_DIR, 'average_income/average_income.compiled'),
    pk: join(PAYROLL_DIR, 'average_income/average_income_pk.key'),
    vk: join(PAYROLL_DIR, 'average_income/average_income_vk.key'),
    settings: join(PAYROLL_DIR, 'average_income/average_income_settings.json')
  },
  [ProofType.CREDIT_SCORE]: {
    onnx: join(PAYROLL_DIR, 'credit_score/credit_score.onnx'),
    compiled: join(PAYROLL_DIR, 'credit_score/credit_score.compiled'),
    pk: join(PAYROLL_DIR, 'credit_score/credit_score_pk.key'),
    vk: join(PAYROLL_DIR, 'credit_score/credit_score_vk.key'),
    settings: join(PAYROLL_DIR, 'credit_score/credit_score_settings.json')
  }
};
