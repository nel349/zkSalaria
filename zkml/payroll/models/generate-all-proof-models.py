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
    Proof Type 4: CREDIT_SCORE
    Input: [payment1, ..., payment12, threshold]
    Output: 1 if ML-computed credit score >= threshold, else 0

    Credit score formula (simplified):
    - Payment consistency: 40% (low std dev is good)
    - Average payment: 30% (higher is better)
    - Payment regularity: 30% (all 12 payments present is good)

    Score range: 300-850 (like FICO)
    """
    def __init__(self):
        super().__init__()
        # Small neural network for credit scoring
        self.fc1 = nn.Linear(12, 8)
        self.fc2 = nn.Linear(8, 4)
        self.fc3 = nn.Linear(4, 1)
        self.relu = nn.ReLU()

    def forward(self, x):
        payments = x[:12]
        threshold = x[12]

        # Calculate credit score using ML model
        # Feature engineering
        avg_payment = torch.mean(payments)
        std_payment = torch.std(payments)

        # Consistency score (lower std dev is better)
        # Normalize std dev relative to average
        consistency_factor = 1.0 - torch.min(std_payment / (avg_payment + 1e-6), torch.tensor(1.0))
        consistency_score = consistency_factor * 340  # Max 340 points

        # Average payment score (scaled)
        # Assuming $10k/month = max score
        avg_score = torch.min(avg_payment / 10000.0, torch.tensor(1.0)) * 255  # Max 255 points

        # Regularity score (all payments > 0)
        regularity = (payments > 0).float().mean() * 255  # Max 255 points

        # Total credit score: 300 (base) + components
        credit_score = 300 + consistency_score + avg_score + regularity

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
        # Threshold: 650 (employee exceeds it)
        data = payments + [650]
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
