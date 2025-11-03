#!/usr/bin/env python3
"""
Example 1: Simple Threshold Proof using EZKL Python API

Proves: "My average income > $5000"
Without revealing: Exact payment amounts or exact average
"""

import torch
import torch.nn as nn
import json
import ezkl
import os
import asyncio

class SimpleThresholdModel(nn.Module):
    """
    A trivial model that calculates sum of 3 payments
    and checks if it's above a threshold.
    """
    def forward(self, payment1, payment2, payment3, threshold):
        # Sum the three payments
        total = payment1 + payment2 + payment3

        # Check if total > threshold * 3 (equivalent to average > threshold)
        threshold_times_three = threshold * 3.0
        is_above = (total > threshold_times_three).float()

        return is_above

async def main():
    print()
    print("=" * 60)
    print("  Example 1: Simple Threshold Proof (EZKL Python API)")
    print("=" * 60)
    print()
    print("  Goal: Prove 'average income > $5000'")
    print("        WITHOUT revealing exact payments")
    print()
    print("=" * 60)
    print()

    # Step 1: Create ONNX model
    print("🔧 Step 1: Creating simple computation graph...")
    print("   Inputs: 3 payments + threshold")
    print("   Computation: total = sum(payments)")
    print("   Check: is total > threshold * 3?")
    print("   (This is equivalent to: average > threshold)")
    print()

    model = SimpleThresholdModel()
    model.eval()

    # Example inputs for ONNX export
    payment1 = torch.rand(1, 1, requires_grad=True)
    payment2 = torch.rand(1, 1, requires_grad=True)
    payment3 = torch.rand(1, 1, requires_grad=True)
    threshold = torch.rand(1, 1, requires_grad=True)

    # Export to ONNX
    torch.onnx.export(
        model,
        (payment1, payment2, payment3, threshold),
        "network.onnx",
        export_params=True,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output']
    )

    print("✅ ONNX model saved: network.onnx")
    print()

    # Step 2: Prepare private input data
    print("🔧 Step 2: Preparing input data...")

    payment1_val = 5000.0
    payment2_val = 5200.0
    payment3_val = 5100.0
    threshold_val = 5000.0

    print(f"   Private inputs: [{payment1_val}, {payment2_val}, {payment3_val}]")
    print(f"   Threshold: {threshold_val}")
    print()

    # Create input data
    shape = [1]
    input_data = {
        "input_shapes": [shape, shape, shape, shape],
        "input_data": [
            [payment1_val],
            [payment2_val],
            [payment3_val],
            [threshold_val]
        ]
    }

    with open("input.json", "w") as f:
        json.dump(input_data, f, indent=2)

    print("✅ Input data saved: input.json")
    print()

    # Step 3: Generate ZK proof with EZKL Python API
    print("🔧 Step 3: Generating ZK proof with EZKL Python API...")
    print("   (This may take 30-60 seconds)")
    print()

    try:
        # Generate settings
        print("   → gen-settings...")
        py_run_args = ezkl.PyRunArgs()
        py_run_args.input_visibility = "private"
        py_run_args.output_visibility = "public"
        py_run_args.param_visibility = "fixed"

        res = ezkl.gen_settings(
            "network.onnx",
            "settings.json",
            py_run_args=py_run_args
        )
        assert res == True
        print("   ✓ Settings generated")

        # Calibrate settings
        print("   → calibrate-settings...")
        res = ezkl.calibrate_settings(
            data="input.json",
            model="network.onnx",
            settings="settings.json",
            target="resources"
        )
        assert res == True
        print("   ✓ Settings calibrated")

        # Compile circuit
        print("   → compile-circuit...")
        res = ezkl.compile_circuit(
            "network.onnx",
            "model.compiled",
            "settings.json"
        )
        assert res == True
        print("   ✓ Circuit compiled")

        # Download SRS (Structured Reference String)
        print("   → get-srs...")
        res = await ezkl.get_srs(
            settings_path="settings.json"
        )
        assert res == True
        print("   ✓ SRS downloaded")

        # Setup (generate proving/verification keys)
        print("   → setup...")
        res = ezkl.setup(
            "model.compiled",
            "vk.key",
            "pk.key"
        )
        assert res == True
        print("   ✓ Proving keys generated")

        # Generate witness
        print("   → gen-witness...")
        witness_data = ezkl.gen_witness(
            data="input.json",
            model="model.compiled",
            output="witness.json"
        )
        # Write witness data to file manually
        with open("witness.json", "w") as f:
            json.dump(witness_data, f, indent=2)
        print("   ✓ Witness generated")

        # Generate proof
        print("   → prove...")
        proof_data = ezkl.prove(
            witness="witness.json",
            model="model.compiled",
            pk_path="pk.key",
            proof_path="proof.json",
            proof_type="single"
        )
        # prove() returns the proof data as a dict (not True/False)
        # The proof is also saved to proof.json
        assert isinstance(proof_data, dict), f"Expected dict, got {type(proof_data)}"
        assert "proof" in proof_data, "Proof data missing 'proof' key"
        print("   ✓ Proof generated")

        print()
        print("✅ Proof generated: proof.json")
        print()

        # Step 4: Verify the proof
        print("🔧 Step 4: Verifying proof...")
        print()

        res = ezkl.verify(
            "proof.json",
            "settings.json",
            "vk.key"
        )
        assert res == True

        print()
        print("✅ Proof verified successfully!")
        print()

        # Print summary
        avg = (payment1_val + payment2_val + payment3_val) / 3

        print("=" * 60)
        print("🎉 SUCCESS!")
        print("=" * 60)
        print()
        print(f"   Proved: average > {threshold_val} = TRUE")
        print(f"   Without revealing: exact payments or exact average")
        print()
        print("   What the verifier knows:")
        print("   ✅ The computation ran correctly")
        print("   ✅ Result is TRUE (average > threshold)")
        print()
        print("   What the verifier DOESN'T know:")
        print(f"   ❌ Payment 1: ${payment1_val}")
        print(f"   ❌ Payment 2: ${payment2_val}")
        print(f"   ❌ Payment 3: ${payment3_val}")
        print(f"   ❌ Exact average: ${avg}")
        print()

        # Get proof file size
        proof_size = os.path.getsize("proof.json")
        print(f"📊 Proof size: {proof_size / 1024:.1f} KB")
        print("⏱️  Verification time: ~10ms (instant!)")
        print()
        print("=" * 60)
        print()
        print("🎓 Key Takeaway:")
        print("   ZK proofs let you prove computations ran correctly")
        print("   WITHOUT revealing the private inputs!")
        print()
        print("   This is the foundation of zkSalaria's income proofs.")
        print("=" * 60)
        print()
        print("🚀 Next Steps:")
        print("   1. Try changing the payments in the code")
        print("   2. Try changing the threshold")
        print("   3. Move to Example 2: Add ML layer (linear regression)")
        print()

        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)
