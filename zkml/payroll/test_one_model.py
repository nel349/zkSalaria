#!/usr/bin/env python3
"""Test: Generate just the income_above_threshold model to verify workflow"""

import torch
import torch.nn as nn
import json
import os
import ezkl

class IncomeAboveThresholdModel(nn.Module):
    """
    Proves: Sum of 6 payments >= threshold
    Returns: 1.0 if total >= threshold, 0.0 otherwise
    """
    def forward(self, p1, p2, p3, p4, p5, p6, threshold):
        total = p1 + p2 + p3 + p4 + p5 + p6
        result = (total > threshold).float()
        return result

def main():
    print("\n" + "="*70)
    print("  Test: Income Above Threshold (6 payments)")
    print("="*70)

    output_dir = "generated/income_above_threshold"
    os.makedirs(output_dir, exist_ok=True)
    os.chdir(output_dir)

    model = IncomeAboveThresholdModel()
    model.eval()

    # Example: 6 payments totaling $30,000, threshold $25,000
    payments = [torch.tensor([[p]], dtype=torch.float32) for p in
                [5000.0, 5100.0, 5200.0, 4900.0, 5000.0, 4800.0]]
    threshold = torch.tensor([[25000.0]], dtype=torch.float32)

    # Export ONNX
    print("\n1. Exporting ONNX model...")
    torch.onnx.export(
        model,
        tuple(payments + [threshold]),
        "income_above_threshold.onnx",
        export_params=True,
        opset_version=10,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output']
    )

    # Sample input
    test_payments = [5000.0, 5100.0, 5200.0, 4900.0, 5000.0, 4800.0]
    input_data = {
        "input_shapes": [[1]] * 7,
        "input_data": [[p] for p in test_payments] + [[25000.0]]
    }
    with open("income_above_threshold_input.json", "w") as f:
        json.dump(input_data, f, indent=2)

    print(f"   ✓ ONNX model generated")
    print(f"   Total: ${sum(test_payments):.2f}, Threshold: $25,000")

    # EZKL workflow (following working example)
    print("\n2. Generating settings...")
    py_run_args = ezkl.PyRunArgs()
    py_run_args.input_visibility = "private"
    py_run_args.output_visibility = "public"
    py_run_args.param_visibility = "fixed"  # CRITICAL: must be "fixed"

    ezkl.gen_settings(
        "income_above_threshold.onnx",
        "income_above_threshold_settings.json",
        py_run_args=py_run_args
    )
    print("   ✓ Settings generated")

    print("\n3. Calibrating settings...")
    ezkl.calibrate_settings(
        data="income_above_threshold_input.json",
        model="income_above_threshold.onnx",
        settings="income_above_threshold_settings.json",
        target="resources"
    )
    print("   ✓ Settings calibrated")

    print("\n4. Compiling circuit...")
    ezkl.compile_circuit(
        "income_above_threshold.onnx",
        "income_above_threshold.compiled",
        "income_above_threshold_settings.json"
    )
    print("   ✓ Circuit compiled")

    print("\n5. Generating keys...")
    ezkl.setup(
        "income_above_threshold.compiled",
        "income_above_threshold_vk.key",
        "income_above_threshold_pk.key",
        srs_path="../kzg_bn254_15.srs"
    )
    print("   ✓ Keys generated")

    print("\n6. Testing proof generation...")
    ezkl.gen_witness(
        "income_above_threshold_input.json",
        "income_above_threshold.compiled",
        "test_witness.json"
    )
    print("   ✓ Witness generated")

    ezkl.prove(
        witness="test_witness.json",
        model="income_above_threshold.compiled",
        pk_path="income_above_threshold_pk.key",
        proof_path="test_proof.json",
        proof_type="single"
    )
    print("   ✓ Proof generated!")

    print("\n" + "="*70)
    print("  ✅ SUCCESS! All steps completed.")
    print("="*70)

    os.chdir("../..")

if __name__ == "__main__":
    main()
