#!/usr/bin/env python3
"""
Test proof generation and verification for all 4 models
Ensures the complete workflow works end-to-end
"""

import ezkl
import os
import json

def test_model(name, display_name):
    """Test witness generation, proof generation, and verification"""
    print(f"\n{'='*70}")
    print(f"  Testing: {display_name}")
    print(f"{'='*70}")

    model_dir = f"generated/{name}"
    os.chdir(model_dir)

    try:
        # Step 1: Generate witness
        print("   1/3: Generating witness...")
        ezkl.gen_witness(
            data=f"{name}_input.json",
            model=f"{name}.compiled",
            output="test_witness.json"
        )
        print("   ✓ Witness generated")

        # Step 2: Generate proof
        print("   2/3: Generating proof...")
        ezkl.prove(
            witness="test_witness.json",
            model=f"{name}.compiled",
            pk_path=f"{name}_pk.key",
            proof_path="test_proof.json",
            proof_type="single"
        )
        print("   ✓ Proof generated")

        # Step 3: Verify proof
        print("   3/3: Verifying proof...")
        ezkl.verify(
            proof_path="test_proof.json",
            settings_path=f"{name}_settings.json",
            vk_path=f"{name}_vk.key",
            srs_path="../../kzg.srs"
        )
        print("   ✓ Proof verified!")

        print(f"\n   ✅ {display_name}: PASSED")
        os.chdir("../..")
        return True

    except Exception as e:
        print(f"\n   ❌ {display_name}: FAILED")
        print(f"   Error: {e}")
        os.chdir("../..")
        return False

def main():
    print("\n" + "="*70)
    print("  zkSalaria: Testing All 4 Models")
    print("  Proof Generation & Verification")
    print("="*70)

    models = [
        ("income_above_threshold", "Income Above Threshold"),
        ("income_range", "Income Range"),
        ("average_income", "Average Income"),
        ("first_time_loan", "First-Time Loan Eligibility")
    ]

    results = {}
    for name, display_name in models:
        results[display_name] = test_model(name, display_name)

    # Summary
    print("\n" + "="*70)
    print("  Test Summary")
    print("="*70)

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for model, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"  {status}  {model}")

    print("\n" + "="*70)
    if passed == total:
        print(f"  ✅ ALL TESTS PASSED ({passed}/{total})")
        print("="*70)
        print("\n  All 4 models can generate and verify proofs with 6 payments!")
        return 0
    else:
        print(f"  ⚠️  SOME TESTS FAILED ({passed}/{total})")
        print("="*70)
        return 1

if __name__ == "__main__":
    exit(main())
