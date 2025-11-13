#!/usr/bin/env python3
"""
Generate all ONNX models with EZKL Python API (WORKING VERSION)
Following the pattern from test_one_model.py that successfully generated proofs
"""

import torch
import torch.nn as nn
import json
import os
import ezkl

# Model definitions
class IncomeAboveThresholdModel(nn.Module):
    def forward(self, p1, p2, p3, p4, p5, p6, threshold):
        total = p1 + p2 + p3 + p4 + p5 + p6
        return (total >= threshold).float()

class IncomeRangeModel(nn.Module):
    def forward(self, p1, p2, p3, p4, p5, p6, min_threshold, max_threshold):
        # Sum 6 monthly payments and annualize (6 months → 12 months)
        total_6_months = p1 + p2 + p3 + p4 + p5 + p6
        annualized_total = total_6_months * 2.0  # Annualize to yearly
        # Check if annualized total is within [min_threshold, max_threshold]
        above_min = (annualized_total >= min_threshold).float()
        below_max = (annualized_total <= max_threshold).float()
        return above_min * below_max

class AverageIncomeModel(nn.Module):
    def forward(self, p1, p2, p3, p4, p5, p6, threshold):
        total = p1 + p2 + p3 + p4 + p5 + p6
        avg = total / 6.0
        return (avg >= threshold).float()

class FirstTimeLoanModel(nn.Module):
    def forward(self, p1, p2, p3, p4, p5, p6, threshold):
        total = p1 + p2 + p3 + p4 + p5 + p6
        avg = total / 6.0
        max_val = torch.maximum(p1, torch.maximum(p2, torch.maximum(p3, torch.maximum(p4, torch.maximum(p5, p6)))))
        min_val = torch.minimum(p1, torch.minimum(p2, torch.minimum(p3, torch.minimum(p4, torch.minimum(p5, p6)))))
        range_ratio = (max_val - min_val) / avg
        is_consistent = (range_ratio < threshold).float()
        return avg * is_consistent

def run_ezkl_workflow(name, num_inputs):
    """Run complete EZKL workflow for a model"""
    print(f"   → gen-settings...")
    py_run_args = ezkl.PyRunArgs()
    py_run_args.input_visibility = "private"
    py_run_args.output_visibility = "public"
    py_run_args.param_visibility = "fixed"
    py_run_args.input_scale = 14  # Precision: 2^-14 ≈ 0.000061 (~$0.61 resolution)

    ezkl.gen_settings(f"{name}.onnx", f"{name}_settings.json", py_run_args=py_run_args)
    print(f"   ✓ Settings")

    print(f"   → calibrate (forcing input_scale: 14)...")
    # IMPORTANT: Force input_scale to 14 for better precision
    # All models use normalized inputs ($X / 10000) to work with scale 14
    # Precision: 2^-14 ≈ 0.000061 (~$0.61 per step)
    # The scales=[14] parameter forces calibration to ONLY try scale 14
    ezkl.calibrate_settings(
        data=f"../../calibration/calibration_{name}.json",
        model=f"{name}.onnx",
        settings=f"{name}_settings.json",
        target="resources",
        scales=[14]  # FORCE input_scale to 14
    )
    print(f"   ✓ Calibrated with input_scale: 14")

    print(f"   → compile...")
    ezkl.compile_circuit(f"{name}.onnx", f"{name}.compiled", f"{name}_settings.json")
    print(f"   ✓ Compiled")

    print(f"   → setup keys...")
    ezkl.setup(f"{name}.compiled", f"{name}_vk.key", f"{name}_pk.key", srs_path="../../kzg.srs")
    print(f"   ✓ Keys")

def main():
    print("\n" + "="*70)
    print("  zkSalaria: Generating all 4 models with EZKL Python API")
    print("="*70)

    # Model 1: Income Above Threshold
    print("\n[1/4] Income Above Threshold")
    os.makedirs("generated/income_above_threshold", exist_ok=True)
    os.chdir("generated/income_above_threshold")

    model = IncomeAboveThresholdModel()
    model.eval()
    # NORMALIZED VALUES: $5000 → 0.5, $25000 → 2.5 (divided by 10000)
    payments = [torch.tensor([[p]], dtype=torch.float32) for p in [0.5, 0.51, 0.52, 0.49, 0.5, 0.48]]
    threshold = torch.tensor([[2.5]], dtype=torch.float32)

    torch.onnx.export(model, tuple(payments + [threshold]), "income_above_threshold.onnx", export_params=True, opset_version=10, do_constant_folding=True, input_names=['input'], output_names=['output'])

    with open("income_above_threshold_input.json", "w") as f:
        json.dump({"input_shapes": [[1]] * 7, "input_data": [[0.5], [0.51], [0.52], [0.49], [0.5], [0.48], [2.5]]}, f, indent=2)

    run_ezkl_workflow("income_above_threshold", 7)
    os.chdir("../..")

    # Model 2: Income Range
    print("\n[2/4] Income Range")
    os.makedirs("generated/income_range", exist_ok=True)
    os.chdir("generated/income_range")

    model = IncomeRangeModel()
    model.eval()
    # NORMALIZED VALUES: $10000/month → 1.0
    # 6 months × $10k = $60k → annualized = $120k/year → normalized = 12.0
    # Range: $80k/year to $120k/year → normalized = [8.0, 12.0]
    payments = [torch.tensor([[p]], dtype=torch.float32) for p in [1.0, 1.0, 1.0, 1.0, 1.0, 1.0]]
    min_t = torch.tensor([[8.0]], dtype=torch.float32)  # $80k yearly
    max_t = torch.tensor([[12.0]], dtype=torch.float32)  # $120k yearly

    torch.onnx.export(model, tuple(payments + [min_t, max_t]), "income_range.onnx", export_params=True, opset_version=10, do_constant_folding=True, input_names=['input'], output_names=['output'])

    with open("income_range_input.json", "w") as f:
        json.dump({"input_shapes": [[1]] * 8, "input_data": [[1.0], [1.0], [1.0], [1.0], [1.0], [1.0], [8.0], [12.0]]}, f, indent=2)

    run_ezkl_workflow("income_range", 8)
    os.chdir("../..")

    # Model 3: Average Income
    print("\n[3/4] Average Income")
    os.makedirs("generated/average_income", exist_ok=True)
    os.chdir("generated/average_income")

    model = AverageIncomeModel()
    model.eval()
    # NORMALIZED VALUES: $5000 → 0.5, $4800 → 0.48
    payments = [torch.tensor([[p]], dtype=torch.float32) for p in [0.5, 0.51, 0.52, 0.49, 0.5, 0.48]]
    threshold = torch.tensor([[0.48]], dtype=torch.float32)

    torch.onnx.export(model, tuple(payments + [threshold]), "average_income.onnx", export_params=True, opset_version=10, do_constant_folding=True, input_names=['input'], output_names=['output'])

    with open("average_income_input.json", "w") as f:
        json.dump({"input_shapes": [[1]] * 7, "input_data": [[0.5], [0.51], [0.52], [0.49], [0.5], [0.48], [0.48]]}, f, indent=2)

    run_ezkl_workflow("average_income", 7)
    os.chdir("../..")

    # Model 4: First Time Loan
    print("\n[4/4] First Time Loan Eligibility")
    os.makedirs("generated/first_time_loan", exist_ok=True)
    os.chdir("generated/first_time_loan")

    model = FirstTimeLoanModel()
    model.eval()
    # NORMALIZED VALUES: $5000 → 0.5, $5500 → 0.55, $4500 → 0.45
    payments = [torch.tensor([[p]], dtype=torch.float32) for p in [0.5, 0.55, 0.5, 0.45, 0.55, 0.5]]
    threshold = torch.tensor([[0.25]], dtype=torch.float32)  # Threshold is already a ratio, no normalization needed

    torch.onnx.export(model, tuple(payments + [threshold]), "first_time_loan.onnx", export_params=True, opset_version=10, do_constant_folding=True, input_names=['input'], output_names=['output'])

    with open("first_time_loan_input.json", "w") as f:
        json.dump({"input_shapes": [[1]] * 7, "input_data": [[0.5], [0.55], [0.5], [0.45], [0.55], [0.5], [0.25]]}, f, indent=2)

    run_ezkl_workflow("first_time_loan", 7)
    os.chdir("../..")

    print("\n" + "="*70)
    print("✅ All 4 models generated successfully!")
    print("="*70)

if __name__ == "__main__":
    main()
