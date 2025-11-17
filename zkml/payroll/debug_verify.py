#!/usr/bin/env python3
"""
Debug verification issue
"""
import ezkl
import json
import os

os.chdir("generated/income_above_threshold")

print("=== Settings ===")
with open("income_above_threshold_settings.json") as f:
    settings = json.load(f)
    print(f"Commitment: {settings['run_args']['commitment']}")
    print(f"Logrows: {settings['run_args']['logrows']}")

print("\n=== Files ===")
for f in ["income_above_threshold.compiled", "income_above_threshold_pk.key",
          "income_above_threshold_vk.key", "test_witness.json", "test_proof.json"]:
    exists = "✓" if os.path.exists(f) else "✗"
    size = os.path.getsize(f) if os.path.exists(f) else 0
    print(f"{exists} {f}: {size:,} bytes")

print("\n=== SRS Files ===")
print(f"~/.ezkl/srs/kzg15.srs: {os.path.exists(os.path.expanduser('~/.ezkl/srs/kzg15.srs'))}")
print(f"~/.ezkl/srs/ipa15.srs: {os.path.exists(os.path.expanduser('~/.ezkl/srs/ipa15.srs'))}")

print("\n=== Attempting verification ===")
try:
    result = ezkl.verify(
        proof_path="test_proof.json",
        settings_path="income_above_threshold_settings.json",
        vk_path="income_above_threshold_vk.key"
    )
    print(f"✓ Verification succeeded: {result}")
except Exception as e:
    print(f"✗ Verification failed: {e}")
    import traceback
    traceback.print_exc()
