#!/usr/bin/env python3
"""
Setup EZKL for All 4 Income Proof Types

This script runs the full EZKL workflow for each proof type:
1. Generate settings
2. Calibrate settings
3. Compile circuit
4. Setup (generate PK and VK)
5. Generate witness
6. Prove
7. Verify

Usage:
    cd zkml/payroll/models
    uv run setup-all-proof-models.py

    (Script will work with files in ../income_above_threshold/, ../income_range/, etc.)
"""

import subprocess
import os
import sys
import time

# Use existing EZKL v23.0.3 installation
EZKL_PATH = "/Users/norman/.ezkl/ezkl"

PROOF_TYPES = [
    ("INCOME_ABOVE_THRESHOLD", "income_above_threshold"),
    ("INCOME_RANGE", "income_range"),
    ("AVERAGE_INCOME", "average_income"),
    ("CREDIT_SCORE", "credit_score")
]

def run_command(cmd: str, description: str) -> bool:
    """Run a shell command and return success/failure"""
    print(f"\n🔧 {description}...")
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        print(f"✅ {description} complete")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"   {e.stderr}")
        return False

def setup_ezkl_for_model(model_name: str) -> bool:
    """Run complete EZKL setup for a single model"""

    print(f"\n{'='*60}")
    print(f"Setting up EZKL for {model_name.upper()}")
    print(f"{'='*60}")

    # File paths - look in organized subdirectories
    proof_dir = f"../{model_name}"
    onnx_file = f"{proof_dir}/{model_name}.onnx"
    input_file = f"{proof_dir}/{model_name}_input.json"
    settings_file = f"{proof_dir}/{model_name}_settings.json"
    compiled_file = f"{proof_dir}/{model_name}.compiled"
    pk_file = f"{proof_dir}/{model_name}_pk.key"
    vk_file = f"{proof_dir}/{model_name}_vk.key"
    witness_file = f"{proof_dir}/{model_name}_witness.json"
    proof_file = f"{proof_dir}/{model_name}_proof.json"

    # Check if ONNX model exists
    if not os.path.exists(onnx_file):
        print(f"❌ {onnx_file} not found. Run generate-all-proof-models.py first.")
        return False

    # Step 1: Generate settings
    if not run_command(
        f"{EZKL_PATH} gen-settings -M {onnx_file} -O {settings_file}",
        "Generating settings"
    ):
        return False

    # Step 2: Calibrate settings
    if not run_command(
        f"{EZKL_PATH} calibrate-settings -M {onnx_file} -D {input_file} --settings-path {settings_file} --target accuracy",
        "Calibrating settings"
    ):
        return False

    # Step 3: Compile circuit
    if not run_command(
        f"{EZKL_PATH} compile-circuit -M {onnx_file} -S {settings_file} --compiled-circuit {compiled_file}",
        "Compiling circuit"
    ):
        return False

    # Step 4: Setup (generate PK and VK) - THIS TAKES LONGEST
    print("\n⏳ Generating proving and verification keys (this may take 2-5 minutes)...")
    srs_path = "../kzg.srs"
    if not run_command(
        f"{EZKL_PATH} setup --compiled-circuit {compiled_file} --srs-path={srs_path} --vk-path {vk_file} --pk-path {pk_file}",
        "Setup (generating PK and VK)"
    ):
        return False

    # Step 5: Generate witness
    if not run_command(
        f"{EZKL_PATH} gen-witness -M {compiled_file} -D {input_file} -O {witness_file}",
        "Generating witness"
    ):
        return False

    # Step 6: Prove
    print("\n⏳ Generating ZK proof (this may take 30-60 seconds)...")
    if not run_command(
        f"{EZKL_PATH} prove -M {compiled_file} -W {witness_file} --pk-path {pk_file} --proof-path {proof_file}",
        "Generating proof"
    ):
        return False

    # Step 7: Verify
    if not run_command(
        f"{EZKL_PATH} verify --proof-path {proof_file} --settings-path {settings_file} --vk-path {vk_file}",
        "Verifying proof"
    ):
        return False

    print(f"\n✅ {model_name.upper()} setup complete!")
    print(f"   Generated files:")
    print(f"   - {vk_file} (verification key)")
    print(f"   - {pk_file} (proving key)")
    print(f"   - {proof_file} (sample proof)")

    return True

def main():
    """Setup EZKL for all 4 proof types"""

    print("\n" + "="*60)
    print("EZKL SETUP FOR ALL INCOME PROOF TYPES")
    print("="*60)

    # Check if ezkl is installed
    try:
        result = subprocess.run(
            f"{EZKL_PATH} --version",
            shell=True,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        print(f"\n✅ EZKL found: {result.stdout.strip()}")
    except subprocess.CalledProcessError:
        print(f"\n❌ EZKL not found at {EZKL_PATH}")
        print("   Install with:")
        print("   cargo install --git https://github.com/zkonduit/ezkl --tag v23.0.3 ezkl")
        sys.exit(1)

    # Download SRS (trusted setup) if not present (in parent directory)
    srs_path = "../kzg.srs"
    if not os.path.exists(srs_path):
        print("\n🔧 Downloading KZG trusted setup (one-time download, ~138MB)...")
        # Need a settings file for download - use one from a proof type directory
        temp_settings = "../income_above_threshold/income_above_threshold_settings.json"
        if not run_command(
            f"{EZKL_PATH} get-srs --srs-path={srs_path} --settings-path={temp_settings}",
            "Downloading SRS"
        ):
            print("❌ Failed to download SRS")
            sys.exit(1)

    # Setup each model
    start_time = time.time()
    success_count = 0

    for proof_type_name, model_name in PROOF_TYPES:
        if setup_ezkl_for_model(model_name):
            success_count += 1
        else:
            print(f"\n❌ Failed to setup {model_name}")
            print("   Continuing with remaining models...")

    elapsed_time = time.time() - start_time

    # Summary
    print("\n" + "="*60)
    print("SETUP COMPLETE")
    print("="*60)
    print(f"\n✅ Successfully set up {success_count}/{len(PROOF_TYPES)} models")
    print(f"⏱️  Total time: {elapsed_time:.1f} seconds ({elapsed_time/60:.1f} minutes)")

    if success_count == len(PROOF_TYPES):
        print("\n🎉 All proof types ready for use!")
        print("\nNext steps:")
        print("  1. Update zkml-verifier to use these verification keys")
        print("  2. Create end-to-end tests for all 4 proof types")
        print("  3. Integrate with payroll contract")
    else:
        print(f"\n⚠️  Some models failed. Check errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
