#!/usr/bin/env python3
"""
Generate EZKL Models for All 4 Income Proof Types

This script creates ONNX neural network models and generates EZKL proofs for:
1. INCOME_ABOVE_THRESHOLD - Proves income > threshold
2. INCOME_RANGE - Proves income is within a range
3. AVERAGE_INCOME - Proves average income meets requirement
4. CREDIT_SCORE - Proves ML-computed credit score > threshold

Each model is a simple neural network that validates the condition.
"""

import torch
import torch.nn as nn
import numpy as np
import json
import os

class IncomeAboveThresholdModel(nn.Module):
    """
    Proof Type 1: INCOME_ABOVE_THRESHOLD
    Input: [payment1, payment2, ..., payment12, threshold]
    Output: 1 if average(payments) > threshold, else 0
    """
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(13, 1)  # 12 payments + 1 threshold

    def forward(self, x):
        # x shape: [12 payments, 1 threshold]
        payments = x[:12]
        threshold = x[12]

        # Calculate average (sum / 12)
        avg_payment = torch.sum(payments) / 12.0

        # Check if average > threshold
        result = (avg_payment > threshold).float()
        return result.unsqueeze(0)


class IncomeRangeModel(nn.Module):
    """
    Proof Type 2: INCOME_RANGE
    Input: [payment1, ..., payment12, threshold_min, threshold_max]
    Output: 1 if threshold_min <= average(payments) <= threshold_max, else 0
    """
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(14, 1)  # 12 payments + 2 thresholds

    def forward(self, x):
        payments = x[:12]
        threshold_min = x[12]
        threshold_max = x[13]

        avg_payment = torch.sum(payments) / 12.0

        # Check if in range
        in_range = ((avg_payment >= threshold_min) & (avg_payment <= threshold_max)).float()
        return in_range.unsqueeze(0)


class AverageIncomeModel(nn.Module):
    """
    Proof Type 3: AVERAGE_INCOME
    Input: [payment1, ..., payment12, threshold]
    Output: 1 if average(payments) >= threshold, else 0
    """
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(13, 1)

    def forward(self, x):
        payments = x[:12]
        threshold = x[12]

        avg_payment = torch.sum(payments) / 12.0

        # Check if average >= threshold (note: >= not >)
        result = (avg_payment >= threshold).float()
        return result.unsqueeze(0)


class CreditScoreModel(nn.Module):
    """
    Proof Type 4: CREDIT_SCORE (SIMPLIFIED for EZKL compatibility)
    Input: [payment1, ..., payment12, threshold]
    Output: 1 if ML-computed credit score >= threshold, else 0

    Simplified credit score formula (EZKL-compatible):
    - Base score: 300
    - Payment score: (sum of all payments) / 12 * 0.05
    - Max realistic score: 300 + (10000 * 0.05) = 300 + 500 = 800

    This simplified model avoids complex operations like std() that cause
    EZKL calibration failures.
    """
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(13, 1)  # Simple linear layer

    def forward(self, x):
        payments = x[:12]
        threshold = x[12]

        # Simplified credit score calculation
        # Score = 300 (base) + (average payment * scaling factor)
        total_payments = torch.sum(payments)
        avg_payment = total_payments / 12.0

        # Scale average payment to score component (0-500 range)
        # $10,000/month = 500 points, so multiply by 0.05
        payment_score = avg_payment * 0.05

        # Total credit score: 300-800 range
        credit_score = 300.0 + payment_score

        # Check if credit score >= threshold
        result = (credit_score >= threshold).float()
        return result.unsqueeze(0)


def create_sample_data(proof_type: str):
    """Create sample input data for each proof type"""

    # Realistic 12-month payment history
    payments = [
        6000, 6200, 6100, 6300,  # Q1
        6500, 6400, 6600, 6700,  # Q2
        6800, 6900, 7000, 7100   # Q3-Q4
    ]

    if proof_type == "INCOME_ABOVE_THRESHOLD":
        # Threshold: $5000 (employee earns more)
        data = payments + [5000]
        return torch.tensor(data, dtype=torch.float32)

    elif proof_type == "INCOME_RANGE":
        # Range: $6000 - $8000 (employee is in range)
        data = payments + [6000, 8000]
        return torch.tensor(data, dtype=torch.float32)

    elif proof_type == "AVERAGE_INCOME":
        # Threshold: $6500 (employee meets it)
        data = payments + [6500]
        return torch.tensor(data, dtype=torch.float32)

    elif proof_type == "CREDIT_SCORE":
        # Threshold: 600 (employee should exceed it with avg $6625/month)
        # Expected score: 300 + (6625 * 0.05) = 300 + 331 = 631
        data = payments + [600]
        return torch.tensor(data, dtype=torch.float32)


def generate_onnx_model(proof_type: str, output_dir: str = "."):
    """Generate ONNX model for the specified proof type"""

    print(f"\n{'='*60}")
    print(f"Generating {proof_type} Model")
    print(f"{'='*60}")

    # Create model
    if proof_type == "INCOME_ABOVE_THRESHOLD":
        model = IncomeAboveThresholdModel()
        input_size = 13
    elif proof_type == "INCOME_RANGE":
        model = IncomeRangeModel()
        input_size = 14
    elif proof_type == "AVERAGE_INCOME":
        model = AverageIncomeModel()
        input_size = 13
    elif proof_type == "CREDIT_SCORE":
        model = CreditScoreModel()
        input_size = 13
    else:
        raise ValueError(f"Unknown proof type: {proof_type}")

    model.eval()

    # Create sample input
    sample_input = create_sample_data(proof_type)

    # Test the model
    with torch.no_grad():
        output = model(sample_input)
        print(f"Sample input: {sample_input.tolist()}")
        print(f"Model output: {output.item()}")
        print(f"Result: {'PASS' if output.item() > 0.5 else 'FAIL'}")

    # Export to ONNX
    onnx_path = os.path.join(output_dir, f"{proof_type.lower()}.onnx")
    torch.onnx.export(
        model,
        sample_input,
        onnx_path,
        export_params=True,
        opset_version=18,  # Updated to version 18 for compatibility
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output']
    )

    print(f"✅ ONNX model saved to: {onnx_path}")

    # Save sample input data
    input_json_path = os.path.join(output_dir, f"{proof_type.lower()}_input.json")
    with open(input_json_path, 'w') as f:
        json.dump({
            "input_data": [[float(x) for x in sample_input.tolist()]]
        }, f, indent=2)

    print(f"✅ Sample input saved to: {input_json_path}")

    return onnx_path


def main():
    """Generate all 4 proof type models"""

    print("\n" + "="*60)
    print("EZKL INCOME PROOF MODEL GENERATOR")
    print("="*60)
    print("\nGenerating ONNX models for all 4 proof types...")

    proof_types = [
        "INCOME_ABOVE_THRESHOLD",
        "INCOME_RANGE",
        "AVERAGE_INCOME",
        "CREDIT_SCORE"
    ]

    generated_models = []

    for proof_type in proof_types:
        try:
            # Output to organized subdirectories (../proof_type_name/)
            proof_type_dir = f"../{proof_type.lower()}"
            os.makedirs(proof_type_dir, exist_ok=True)
            onnx_path = generate_onnx_model(proof_type, proof_type_dir)
            generated_models.append(onnx_path)
        except Exception as e:
            print(f"❌ Error generating {proof_type}: {e}")

    print("\n" + "="*60)
    print("✅ MODEL GENERATION COMPLETE")
    print("="*60)
    print(f"\nGenerated {len(generated_models)} models:")
    for model in generated_models:
        print(f"  - {model}")

    print("\nNext steps:")
    print("  1. Run EZKL setup for each model")
    print("  2. Generate verification keys")
    print("  3. Create end-to-end tests")


if __name__ == "__main__":
    main()
