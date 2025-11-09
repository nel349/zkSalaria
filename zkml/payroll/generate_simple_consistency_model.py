#!/usr/bin/env python3
"""
Generate ONNX model for First-Time Loan Eligibility (Simplified for EZKL)

Uses RANGE instead of VARIANCE for consistency check:
- Consistent = (max - min) / avg < threshold
- Much simpler for ZK circuits than variance calculation

This is a legitimate consistency measure:
- 20% range means payments vary by at most 20% from min to max
- Example: $5000-$6000 range with $5500 avg = 18% range (PASS)
"""

import torch
import torch.nn as nn
import json
import os

class SimpleConsistencyModel(nn.Module):
    """
    Simplified consistency check using range instead of variance.

    Inputs: 12 payments + threshold
    Output: Average salary if consistent, 0 otherwise
    """
    def forward(self, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, threshold):
        # Calculate total and average
        total = p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9 + p10 + p11 + p12
        avg = total / 12.0

        # Find max and min (using torch.max/min for pairs)
        max1 = torch.max(p1, p2)
        max2 = torch.max(p3, p4)
        max3 = torch.max(p5, p6)
        max4 = torch.max(p7, p8)
        max5 = torch.max(p9, p10)
        max6 = torch.max(p11, p12)

        max_a = torch.max(max1, max2)
        max_b = torch.max(max3, max4)
        max_c = torch.max(max5, max6)

        max_ab = torch.max(max_a, max_b)
        max_payment = torch.max(max_ab, max_c)

        min1 = torch.min(p1, p2)
        min2 = torch.min(p3, p4)
        min3 = torch.min(p5, p6)
        min4 = torch.min(p7, p8)
        min5 = torch.min(p9, p10)
        min6 = torch.min(p11, p12)

        min_a = torch.min(min1, min2)
        min_b = torch.min(min3, min4)
        min_c = torch.min(min5, min6)

        min_ab = torch.min(min_a, min_b)
        min_payment = torch.min(min_ab, min_c)

        # Calculate range as percentage of average
        payment_range = max_payment - min_payment
        range_ratio = payment_range / avg

        # Check consistency
        is_consistent = (range_ratio < threshold).float()

        # Return average if consistent, 0 otherwise
        result = avg * is_consistent

        return result


def main():
    print()
    print("=" * 70)
    print("  Generating Simplified Consistency Model (EZKL-Compatible)")
    print("=" * 70)
    print()
    print("  Method: Range-based consistency check")
    print("  Formula: (max - min) / avg < threshold")
    print("  Advantage: Much simpler for ZK circuits than variance")
    print()
    print("=" * 70)
    print()

    # Create output directory
    output_dir = "generated/first_time_loan"
    os.makedirs(output_dir, exist_ok=True)

    print("🔧 Creating ONNX model...")
    print("   Inputs: 12 monthly payments + threshold")
    print("   Logic:")
    print("     1. Calculate avg = sum / 12")
    print("     2. Find max and min payments")
    print("     3. Calculate range_ratio = (max - min) / avg")
    print("     4. If range_ratio < threshold: return avg (eligible)")
    print("     5. Else: return 0 (not eligible)")
    print()

    model = SimpleConsistencyModel()
    model.eval()

    # Create example inputs
    payments = [torch.tensor([[p]], dtype=torch.float32) for p in [
        5000.0, 5100.0, 5200.0, 5300.0,
        5400.0, 5500.0, 5600.0, 5700.0,
        5800.0, 5900.0, 6000.0, 6100.0
    ]]
    threshold = torch.tensor([[0.25]], dtype=torch.float32)  # 25% range allowed

    # Export to ONNX
    model_path = os.path.join(output_dir, "first_time_loan.onnx")
    torch.onnx.export(
        model,
        tuple(payments + [threshold]),
        model_path,
        export_params=True,
        do_constant_folding=True,
        input_names=[f'payment_{i+1}' for i in range(12)] + ['threshold'],
        output_names=['eligible_amount']
    )

    print(f"✅ ONNX model saved: {model_path}")
    print()

    # Create sample input data
    print("🔧 Creating sample input data...")

    consistent_payments = [5000.0 + (i * 100) for i in range(12)]
    avg = sum(consistent_payments) / 12
    max_p = max(consistent_payments)
    min_p = min(consistent_payments)
    range_ratio = (max_p - min_p) / avg

    print(f"   Test payments: ${min_p:.0f} to ${max_p:.0f}")
    print(f"   Average: ${avg:.2f}")
    print(f"   Range: ${max_p - min_p:.0f}")
    print(f"   Range ratio: {range_ratio:.4f} ({range_ratio * 100:.1f}%)")
    print(f"   Threshold: 0.25 (25%)")
    print(f"   Result: {'PASS' if range_ratio < 0.25 else 'FAIL'}")
    print()

    input_data = {
        "input_shapes": [[1]] * 13,
        "input_data": [[p] for p in consistent_payments] + [[0.25]]
    }

    input_path = os.path.join(output_dir, "first_time_loan_input.json")
    with open(input_path, "w") as f:
        json.dump(input_data, f, indent=2)

    print(f"✅ Sample input saved: {input_path}")
    print()

    print("=" * 70)
    print("✅ Model generation complete!")
    print("=" * 70)
    print()
    print("📁 Files generated:")
    print(f"   • {model_path}")
    print(f"   • {input_path}")
    print()
    print("🚀 Next: Run EZKL setup")
    print(f"   cd {output_dir}")
    print("   ~/.ezkl/ezkl gen-settings -M first_time_loan.onnx")
    print("   ~/.ezkl/ezkl calibrate-settings -M first_time_loan.onnx -D first_time_loan_input.json")
    print()

if __name__ == "__main__":
    main()
