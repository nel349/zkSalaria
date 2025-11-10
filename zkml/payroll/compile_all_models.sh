#!/bin/bash
#
# Generate and verify all ZKML models (6 monthly payments)
# This script runs the complete workflow:
# 1. Generate models with EZKL Python API
# 2. Test proof generation and verification
#

set -e

echo "========================================================================"
echo "  zkSalaria: Complete ZKML Model Generation & Verification"
echo "  Using EZKL Python API with 6 monthly payments"
echo "========================================================================"
echo ""

# Step 1: Generate all models
echo "Step 1/2: Generating all models..."
echo ""
uv run generate_all_models.py
echo ""

# Step 2: Test proof generation and verification
echo "Step 2/2: Testing proof generation and verification..."
echo ""
uv run test_all_proofs.py

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "========================================================================"
    echo "  ✅ SUCCESS! All 4 models verified and working!"
    echo "========================================================================"
    echo ""
    echo "Generated models:"
    echo "  • income_above_threshold  - Prove total income >= threshold"
    echo "  • income_range            - Prove income in range [min, max]"
    echo "  • average_income          - Prove average income >= threshold"
    echo "  • first_time_loan         - Prove payment consistency"
    echo ""
    echo "Each model includes:"
    echo "  ✓ Compiled circuit (.compiled)"
    echo "  ✓ Proving key (_pk.key)"
    echo "  ✓ Verification key (_vk.key)"
    echo "  ✓ Settings (_settings.json)"
    echo "  ✓ Verified test proof (test_proof.json)"
    echo ""
else
    echo "========================================================================"
    echo "  ❌ FAILED! Some models did not verify correctly"
    echo "========================================================================"
    exit 1
fi
