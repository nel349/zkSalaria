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
        return (total > threshold).float()

class IncomeRangeModel(nn.Module):
    def forward(self, p1, p2, p3, p4, p5, p6, min_threshold, max_threshold):
        total = p1 + p2 + p3 + p4 + p5 + p6
        above_min = (total >= min_threshold).float()
        below_max = (total <= max_threshold).float()
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
    py_run_args.input_scale = 7  # MANUALLY SET TO 7 to prevent overflow

    ezkl.gen_settings(f"{name}.onnx", f"{name}_settings.json", py_run_args=py_run_args)
    print(f"   ✓ Settings")

    print(f"   → calibrate (forcing input_scale: 7)...")
    # IMPORTANT: Force input_scale to 7 to prevent overflow
    # All models use normalized inputs ($X / 10000) to work with scale 7
    # The scales=[7] parameter forces calibration to ONLY try scale 7
    ezkl.calibrate_settings(
        data=f"../../calibration/calibration_{name}.json",
        model=f"{name}.onnx",
        settings=f"{name}_settings.json",
        target="resources",
        scales=[7]  # FORCE input_scale to 7
    )
    print(f"   ✓ Calibrated with input_scale: 7")

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
    payments = [torch.tensor([[p]], dtype=torch.float32) for p in [5000.0, 5100.0, 5200.0, 4900.0, 5000.0, 4800.0]]
    threshold = torch.tensor([[25000.0]], dtype=torch.float32)
    
    torch.onnx.export(model, tuple(payments + [threshold]), "income_above_threshold.onnx", export_params=True, opset_version=10, do_constant_folding=True, input_names=['input'], output_names=['output'])
    
    with open("income_above_threshold_input.json", "w") as f:
        json.dump({"input_shapes": [[1]] * 7, "input_data": [[5000.0], [5100.0], [5200.0], [4900.0], [5000.0], [4800.0], [25000.0]]}, f, indent=2)
    
    run_ezkl_workflow("income_above_threshold", 7)
    os.chdir("../..")

    # Model 2: Income Range
    print("\n[2/4] Income Range")
    os.makedirs("generated/income_range", exist_ok=True)
    os.chdir("generated/income_range")
    
    model = IncomeRangeModel()
    model.eval()
    payments = [torch.tensor([[p]], dtype=torch.float32) for p in [5000.0, 5100.0, 5200.0, 4900.0, 5000.0, 4800.0]]
    min_t = torch.tensor([[28000.0]], dtype=torch.float32)
    max_t = torch.tensor([[32000.0]], dtype=torch.float32)
    
    torch.onnx.export(model, tuple(payments + [min_t, max_t]), "income_range.onnx", export_params=True, opset_version=10, do_constant_folding=True, input_names=['input'], output_names=['output'])
    
    with open("income_range_input.json", "w") as f:
        json.dump({"input_shapes": [[1]] * 8, "input_data": [[5000.0], [5100.0], [5200.0], [4900.0], [5000.0], [4800.0], [28000.0], [32000.0]]}, f, indent=2)
    
    run_ezkl_workflow("income_range", 8)
    os.chdir("../..")

    # Model 3: Average Income
    print("\n[3/4] Average Income")
    os.makedirs("generated/average_income", exist_ok=True)
    os.chdir("generated/average_income")
    
    model = AverageIncomeModel()
    model.eval()
    payments = [torch.tensor([[p]], dtype=torch.float32) for p in [5000.0, 5100.0, 5200.0, 4900.0, 5000.0, 4800.0]]
    threshold = torch.tensor([[4800.0]], dtype=torch.float32)
    
    torch.onnx.export(model, tuple(payments + [threshold]), "average_income.onnx", export_params=True, opset_version=10, do_constant_folding=True, input_names=['input'], output_names=['output'])
    
    with open("average_income_input.json", "w") as f:
        json.dump({"input_shapes": [[1]] * 7, "input_data": [[5000.0], [5100.0], [5200.0], [4900.0], [5000.0], [4800.0], [4800.0]]}, f, indent=2)
    
    run_ezkl_workflow("average_income", 7)
    os.chdir("../..")

    # Model 4: First Time Loan
    print("\n[4/4] First Time Loan Eligibility")
    os.makedirs("generated/first_time_loan", exist_ok=True)
    os.chdir("generated/first_time_loan")
    
    model = FirstTimeLoanModel()
    model.eval()
    payments = [torch.tensor([[p]], dtype=torch.float32) for p in [5000.0, 5500.0, 5000.0, 4500.0, 5500.0, 5000.0]]
    threshold = torch.tensor([[0.25]], dtype=torch.float32)
    
    torch.onnx.export(model, tuple(payments + [threshold]), "first_time_loan.onnx", export_params=True, opset_version=10, do_constant_folding=True, input_names=['input'], output_names=['output'])
    
    with open("first_time_loan_input.json", "w") as f:
        json.dump({"input_shapes": [[1]] * 7, "input_data": [[5000.0], [5500.0], [5000.0], [4500.0], [5500.0], [5000.0], [0.25]]}, f, indent=2)
    
    run_ezkl_workflow("first_time_loan", 7)
    os.chdir("../..")

    print("\n" + "="*70)
    print("✅ All 4 models generated successfully!")
    print("="*70)

if __name__ == "__main__":
    main()
