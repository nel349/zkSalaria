#!/usr/bin/env python3
"""
Compare KZG vs IPA commitment schemes
Test if verification works with default KZG
"""
import ezkl
import json
import os
import shutil
import torch
import torch.nn as nn

class IncomeAboveThresholdModel(nn.Module):
    def forward(self, p1, p2, p3, p4, p5, p6, threshold):
        total = p1 + p2 + p3 + p4 + p5 + p6
        return (total >= threshold).float()

def test_commitment(commitment_type):
    """Test a specific commitment type"""
    print(f"\n{'='*70}")
    print(f"  Testing {commitment_type} Commitment")
    print(f"{'='*70}")

    model_name = "test_model"
    test_dir = f"test_{commitment_type.lower()}"

    # Clean slate
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
    os.makedirs(test_dir)
    os.chdir(test_dir)

    # Export ONNX
    print("  → Exporting ONNX...")
    model = IncomeAboveThresholdModel()
    model.eval()

    payments = [torch.tensor([[p]], dtype=torch.float32) for p in [0.5, 0.51, 0.52, 0.49, 0.5, 0.48]]
    threshold = torch.tensor([[2.5]], dtype=torch.float32)

    torch.onnx.export(
        model, tuple(payments + [threshold]), f"{model_name}.onnx",
        export_params=True, opset_version=10, do_constant_folding=True,
        input_names=['input'], output_names=['output']
    )
    print("  ✓ ONNX exported")

    # Input JSON
    input_data = {
        "input_shapes": [[1]] * 7,
        "input_data": [[0.5], [0.51], [0.52], [0.49], [0.5], [0.48], [2.5]]
    }
    with open(f"{model_name}_input.json", "w") as f:
        json.dump(input_data, f, indent=2)

    # Settings
    print(f"  → Generating settings ({commitment_type})...")
    py_run_args = ezkl.PyRunArgs()
    py_run_args.input_visibility = "private"
    py_run_args.output_visibility = "public"
    py_run_args.param_visibility = "fixed"
    py_run_args.input_scale = 14

    ezkl.gen_settings(f"{model_name}.onnx", f"{model_name}_settings.json", py_run_args=py_run_args)

    # Set commitment type
    with open(f"{model_name}_settings.json", "r") as f:
        settings = json.load(f)
    settings["run_args"]["commitment"] = commitment_type
    with open(f"{model_name}_settings.json", "w") as f:
        json.dump(settings, f, indent=2)

    print(f"  ✓ Settings: {commitment_type}, logrows={settings['run_args']['logrows']}")

    # Calibrate
    print("  → Calibrating...")
    # Create calibration file in parent directory
    calib_dir = "../calibration"
    if not os.path.exists(calib_dir):
        os.makedirs(calib_dir)
    calib_file = f"{calib_dir}/calibration_{model_name}.json"
    if not os.path.exists(calib_file):
        with open(calib_file, "w") as f:
            json.dump(input_data, f, indent=2)

    ezkl.calibrate_settings(
        data=f"../calibration/calibration_{model_name}.json",
        model=f"{model_name}.onnx",
        settings=f"{model_name}_settings.json",
        target="resources",
        scales=[14]
    )
    print("  ✓ Calibrated")

    # Compile
    print("  → Compiling...")
    ezkl.compile_circuit(f"{model_name}.onnx", f"{model_name}.compiled", f"{model_name}_settings.json")
    print("  ✓ Compiled")

    # Setup with appropriate SRS
    print("  → Setting up keys...")
    if commitment_type == "IPA":
        srs_path = "../ipa.srs"
        if not os.path.exists(srs_path):
            print(f"  ✗ IPA SRS not found at {srs_path}")
            os.chdir("..")
            return False
    else:  # KZG
        srs_path = None  # Let EZKL use default

    if srs_path:
        ezkl.setup(f"{model_name}.compiled", f"{model_name}_vk.key", f"{model_name}_pk.key", srs_path=srs_path)
    else:
        ezkl.setup(f"{model_name}.compiled", f"{model_name}_vk.key", f"{model_name}_pk.key")

    print(f"  ✓ Keys generated (VK: {os.path.getsize(f'{model_name}_vk.key'):,} bytes)")

    # Witness
    print("  → Generating witness...")
    ezkl.gen_witness(
        data=f"{model_name}_input.json",
        model=f"{model_name}.compiled",
        output="test_witness.json"
    )
    print("  ✓ Witness generated")

    # Prove
    print("  → Generating proof...")
    ezkl.prove(
        witness="test_witness.json",
        model=f"{model_name}.compiled",
        pk_path=f"{model_name}_pk.key",
        proof_path="test_proof.json",
        proof_type="single"
    )
    print(f"  ✓ Proof generated ({os.path.getsize('test_proof.json'):,} bytes)")

    # Verify
    print("  → Verifying proof...")
    try:
        if srs_path:
            result = ezkl.verify(
                proof_path="test_proof.json",
                settings_path=f"{model_name}_settings.json",
                vk_path=f"{model_name}_vk.key",
                srs_path=srs_path
            )
        else:
            result = ezkl.verify(
                proof_path="test_proof.json",
                settings_path=f"{model_name}_settings.json",
                vk_path=f"{model_name}_vk.key"
            )

        print(f"  ✓ VERIFICATION SUCCEEDED!")
        os.chdir("..")
        return True

    except Exception as e:
        print(f"  ✗ VERIFICATION FAILED: {e}")
        os.chdir("..")
        return False

def main():
    print("\n" + "="*70)
    print("  Commitment Scheme Comparison Test")
    print("="*70)

    # Test KZG (default)
    kzg_result = test_commitment("KZG")

    # Test IPA
    ipa_result = test_commitment("IPA")

    # Summary
    print("\n" + "="*70)
    print("  Test Results")
    print("="*70)
    print(f"  KZG:  {'✅ PASS' if kzg_result else '❌ FAIL'}")
    print(f"  IPA:  {'✅ PASS' if ipa_result else '❌ FAIL'}")
    print("="*70)

    if kzg_result and not ipa_result:
        print("\n  CONCLUSION: IPA commitment has an issue")
        print("  KZG works but IPA fails verification")
    elif not kzg_result and not ipa_result:
        print("\n  CONCLUSION: Both schemes fail - model or setup issue")
    elif kzg_result and ipa_result:
        print("\n  CONCLUSION: Both schemes work!")
    else:
        print("\n  CONCLUSION: Unexpected - IPA works but KZG fails?")

    return 0 if (kzg_result and ipa_result) else 1

if __name__ == "__main__":
    exit(main())
