#!/usr/bin/env python3
"""
Verify a ZK proof using EZKL Python API
Called by the TypeScript verifier
"""

import sys
import ezkl
import json

def verify_proof(proof_path: str, settings_path: str, vk_path: str, srs_path: str = "kzg.srs") -> bool:
    """Verify a proof using EZKL"""
    try:
        ezkl.verify(
            proof_path=proof_path,
            settings_path=settings_path,
            vk_path=vk_path,
            srs_path=srs_path
        )
        return True
    except Exception as e:
        print(f"Verification failed: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: verify_proof.py <proof_path> <settings_path> <vk_path> [srs_path]", file=sys.stderr)
        sys.exit(1)

    proof_path = sys.argv[1]
    settings_path = sys.argv[2]
    vk_path = sys.argv[3]
    srs_path = sys.argv[4] if len(sys.argv) > 4 else "kzg.srs"

    verified = verify_proof(proof_path, settings_path, vk_path, srs_path)

    # Output JSON result
    result = {
        "verified": verified
    }
    print(json.dumps(result))
    sys.exit(0 if verified else 1)
