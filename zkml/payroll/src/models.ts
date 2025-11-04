/**
 * ONNX Model Management
 *
 * NOTE: ONNX models are pre-generated using Python/PyTorch and checked into the repository.
 * This module provides utilities for working with the models.
 *
 * To regenerate models (one-time setup):
 *   cd models && uv run generate-all-proof-models.py
 */

import { existsSync } from 'fs';
import { ProofType, MODEL_CONFIGS } from './types';

export class ModelManager {
  /**
   * Check if all required model files exist
   */
  static validateModels(): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    for (const proofType of Object.values(ProofType)) {
      if (typeof proofType === 'number') {
        const paths = MODEL_CONFIGS[proofType as ProofType];

        if (!existsSync(paths.onnx)) missing.push(paths.onnx);
        if (!existsSync(paths.compiled)) missing.push(paths.compiled);
        if (!existsSync(paths.pk)) missing.push(paths.pk);
        if (!existsSync(paths.vk)) missing.push(paths.vk);
        if (!existsSync(paths.settings)) missing.push(paths.settings);
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Get information about a specific model
   */
  static getModelInfo(proofType: ProofType) {
    const paths = MODEL_CONFIGS[proofType];
    const exists = {
      onnx: existsSync(paths.onnx),
      compiled: existsSync(paths.compiled),
      pk: existsSync(paths.pk),
      vk: existsSync(paths.vk),
      settings: existsSync(paths.settings)
    };

    return {
      proofType,
      paths,
      exists,
      ready: Object.values(exists).every(Boolean)
    };
  }
}

/**
 * Calculate expected credit score for given payments
 * (Matches the simplified ONNX model formula)
 */
export function calculateCreditScore(payments: number[]): number {
  if (payments.length !== 12) {
    throw new Error('Exactly 12 payments required');
  }

  const total = payments.reduce((sum, p) => sum + p, 0);
  const avg = total / 12;

  // Simplified formula: 300 + (avg * 0.05)
  // Range: 300-800
  return 300 + (avg * 0.05);
}

/**
 * Calculate average income from payments
 */
export function calculateAverageIncome(payments: number[]): number {
  if (payments.length !== 12) {
    throw new Error('Exactly 12 payments required');
  }

  const total = payments.reduce((sum, p) => sum + p, 0);
  return total / 12;
}
