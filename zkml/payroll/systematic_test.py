#!/usr/bin/env python3
"""
Systematic test to isolate verification issue
Clean regeneration of one model with detailed logging at each step
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

def main():
    print("\n" + "="*70)
    print("  SYSTEMATIC VERIFICATION DEBUG")
    print("="*70)

    model_name = "income_above_threshold"
    model_dir = f"generated/{model_name}"

    # Step 1: Clean slate
    print("\n[Step 1/8] Cleaning previous artifacts...")
    if os.path.exists(model_dir):
        shutil.rmtree(model_dir)
    os.makedirs(model_dir)
    os.chdir(model_dir)
    print("   ✓ Clean directory created")

    # Step 2: Export ONNX model
    print("\n[Step 2/8] Exporting ONNX model...")
    model = IncomeAboveThresholdModel()
    model.eval()

    # Normalized inputs: $5000 → 0.5, $25000 → 2.5
    payments = [torch.tensor([[p]], dtype=torch.float32) for p in [0.5, 0.51, 0.52, 0.49, 0.5, 0.48]]
    threshold = torch.tensor([[2.5]], dtype=torch.float32)

    torch.onnx.export(
        model,
        tuple(payments + [threshold]),
        f"{model_name}.onnx",
        export_params=True,
        opset_version=10,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output']
    )
    print(f"   ✓ ONNX model exported: {os.path.getsize(f'{model_name}.onnx'):,} bytes")

    # Step 3: Create input JSON
    print("\n[Step 3/8] Creating input JSON...")
    input_data = {
        "input_shapes": [[1]] * 7,
        "input_data": [[0.5], [0.51], [0.52], [0.49], [0.5], [0.48], [2.5]]
    }
    with open(f"{model_name}_input.json", "w") as f:
        json.dump(input_data, f, indent=2)
    print("   ✓ Input JSON created")

    # Step 4: Generate settings with IPA
    print("\n[Step 4/8] Generating settings with IPA commitment...")
    py_run_args = ezkl.PyRunArgs()
    py_run_args.input_visibility = "private"
    py_run_args.output_visibility = "public"
    py_run_args.param_visibility = "fixed"
    py_run_args.input_scale = 14

    ezkl.gen_settings(f"{model_name}.onnx", f"{model_name}_settings.json", py_run_args=py_run_args)

    # Force IPA commitment
    with open(f"{model_name}_settings.json", "r") as f:
        settings = json.load(f)

    print(f"   → Original commitment: {settings['run_args']['commitment']}")
    settings["run_args"]["commitment"] = "IPA"

    with open(f"{model_name}_settings.json", "w") as f:
        json.dump(settings, f, indent=2)

    print(f"   ✓ Settings generated with IPA commitment")
    print(f"   → Logrows: {settings['run_args']['logrows']}")
    print(f"   → Input scale: {settings['run_args']['input_scale']}")

    # Step 5: Calibrate
    print("\n[Step 5/8] Calibrating settings...")
    os.chdir("../..")

    # Check if calibration data exists
    calib_path = f"calibration/calibration_{model_name}.json"
    if not os.path.exists(calib_path):
        print(f"   ! Creating calibration data at {calib_path}")
        os.makedirs("calibration", exist_ok=True)
        with open(calib_path, "w") as f:
            json.dump(input_data, f, indent=2)

    os.chdir(model_dir)

    ezkl.calibrate_settings(
        data=f"../../calibration/calibration_{model_name}.json",
        model=f"{model_name}.onnx",
        settings=f"{model_name}_settings.json",
        target="resources",
        scales=[14]
    )
    print("   ✓ Calibrated")

    # Step 6: Compile
    print("\n[Step 6/8] Compiling circuit...")
    ezkl.compile_circuit(f"{model_name}.onnx", f"{model_name}.compiled", f"{model_name}_settings.json")
    print(f"   ✓ Compiled: {os.path.getsize(f'{model_name}.compiled'):,} bytes")

    # Step 7: Setup (with explicit IPA SRS)
    print("\n[Step 7/8] Setting up keys with IPA SRS...")
    ipa_srs_path = "../../ipa.srs"

    if not os.path.exists(ipa_srs_path):
        print(f"   ✗ IPA SRS not found at {ipa_srs_path}")
        print("   → Run generate_ipa_srs.py first")
        return 1

    print(f"   → IPA SRS size: {os.path.getsize(ipa_srs_path):,} bytes")

    ezkl.setup(
        f"{model_name}.compiled",
        f"{model_name}_vk.key",
        f"{model_name}_pk.key",
        srs_path=ipa_srs_path
    )

    print(f"   ✓ VK: {os.path.getsize(f'{model_name}_vk.key'):,} bytes")
    print(f"   ✓ PK: {os.path.getsize(f'{model_name}_pk.key'):,} bytes")

    # Step 8: Test the proof workflow
    print("\n[Step 8/8] Testing proof workflow...")

    # 8a: Generate witness
    print("   → Generating witness...")
    try:
        ezkl.gen_witness(
            data=f"{model_name}_input.json",
            model=f"{model_name}.compiled",
            output="test_witness.json"
        )
        print(f"   ✓ Witness: {os.path.getsize('test_witness.json'):,} bytes")
    except Exception as e:
        print(f"   ✗ Witness generation failed: {e}")
        return 1

    # 8b: Generate proof
    print("   → Generating proof...")
    try:
        ezkl.prove(
            witness="test_witness.json",
            model=f"{model_name}.compiled",
            pk_path=f"{model_name}_pk.key",
            proof_path="test_proof.json",
            proof_type="single"
        )
        print(f"   ✓ Proof: {os.path.getsize('test_proof.json'):,} bytes")
    except Exception as e:
        print(f"   ✗ Proof generation failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

    # 8c: Verify proof
    print("   → Verifying proof...")
    try:
        # Load settings to check commitment type
        with open(f"{model_name}_settings.json") as f:
            verify_settings = json.load(f)
            commitment_type = verify_settings['run_args']['commitment']
            print(f"   → Settings commitment: {commitment_type}")

        # Check default SRS location
        default_ipa_srs = os.path.expanduser("~/.ezkl/srs/ipa15.srs")
        print(f"   → Default IPA SRS exists: {os.path.exists(default_ipa_srs)}")

        result = ezkl.verify(
            proof_path="test_proof.json",
            settings_path=f"{model_name}_settings.json",
            vk_path=f"{model_name}_vk.key",
            srs_path=ipa_srs_path  # Explicitly provide IPA SRS
        )
        print(f"   ✓ VERIFICATION SUCCEEDED: {result}")

        print("\n" + "="*70)
        print("  ✅ SUCCESS: Model verified correctly!")
        print("="*70)
        return 0

    except Exception as e:
        print(f"   ✗ VERIFICATION FAILED: {e}")
        import traceback
        traceback.print_exc()

        print("\n" + "="*70)
        print("  ❌ FAILURE: Verification error")
        print("="*70)
        print("\nDiagnostic information:")
        print(f"  - Commitment type in settings: {commitment_type}")
        print(f"  - IPA SRS provided: {ipa_srs_path}")
        print(f"  - IPA SRS size: {os.path.getsize(ipa_srs_path):,} bytes")
        print(f"  - VK size: {os.path.getsize(f'{model_name}_vk.key'):,} bytes")
        print(f"  - Proof size: {os.path.getsize('test_proof.json'):,} bytes")
        return 1

if __name__ == "__main__":
    exit(main())
