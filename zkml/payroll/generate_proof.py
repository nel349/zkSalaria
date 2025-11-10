#!/usr/bin/env python3
"""
Generate a ZK proof using EZKL Python API
Called by the TypeScript proof generator
"""

import sys
import ezkl
import json

def generate_proof(onnx_path: str, compiled_path: str, pk_path: str, input_data_path: str, witness_output: str, proof_output: str) -> bool:
    """Generate a ZK proof using EZKL"""
    try:
        # Step 1: Generate witness from compiled model
        ezkl.gen_witness(
            data=input_data_path,
            model=compiled_path,
            output=witness_output
        )

        # Step 2: Generate proof from compiled circuit
        ezkl.prove(
            witness=witness_output,
            model=compiled_path,
            pk_path=pk_path,
            proof_path=proof_output,
            proof_type="single"
        )

        return True
    except Exception as e:
        print(f"Proof generation failed: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    if len(sys.argv) < 7:
        print("Usage: generate_proof.py <onnx_path> <compiled_path> <pk_path> <input_data> <witness_output> <proof_output>", file=sys.stderr)
        sys.exit(1)

    onnx_path = sys.argv[1]
    compiled_path = sys.argv[2]
    pk_path = sys.argv[3]
    input_data = sys.argv[4]
    witness_output = sys.argv[5]
    proof_output = sys.argv[6]

    success = generate_proof(onnx_path, compiled_path, pk_path, input_data, witness_output, proof_output)

    # Output JSON result
    result = {
        "success": success,
        "proof_path": proof_output if success else None
    }
    print(json.dumps(result))
    sys.exit(0 if success else 1)
