 📊 Complete Flow Diagram

  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │                          PHASE 1: SETUP (ONE-TIME)                                   │
  └─────────────────────────────────────────────────────────────────────────────────────┘

      Company Admin                    Smart Contract
           │                                 │
           │  1. Register Verifier           │
           │  registerTrustedVerifier()      │
           │  - verifierPubkey               │
           │────────────────────────────────>│
           │                                 │
           │  ✅ Verifier whitelisted        │
           │<────────────────────────────────│
           │                                 │


  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │                   PHASE 2: PROOF GENERATION (EMPLOYEE FLOW)                          │
  └─────────────────────────────────────────────────────────────────────────────────────┘

      Employee                    ZKML Verifier Service              Smart Contract
         │                                │                               │
         │ 2. Request income proof        │                               │
         │    - employeeId                │                               │
         │    - proofType                 │                               │
         │    - thresholdMin: $40,000 ◄───┼───────────────────────────────┼── Employee sets
         │    - thresholdMax: 0           │                               │   desired threshold
         │    - payments: [...]           │                               │
         │───────────────────────────────>│                               │
         │                                │                               │
         │                                │ 3. Generate ZK Proof          │
         │                                │    (using EZKL)               │
         │                                │    - Proves: income ≥ $40k    │
         │                                │    - Without revealing amount │
         │                                │                               │
         │                                │ 4. Create Attestation         │
         │                                │    (CRITICAL STEP)            │
         │                                │                               │
         │                                │    attestation_data = pack({  │
         │                                │      employeeId,              │
         │                                │      proofType: 1,            │
         │                                │      thresholdMin: $40k, ◄────┼── Threshold BOUND
         │                                │      thresholdMax: 0,         │   inside attestation
         │                                │      historyCommitment,       │
         │                                │      txids: [...],            │
         │                                │      timestamp                │
         │                                │    })                         │
         │                                │                               │
         │                                │    attestation_hash =         │
         │                                │      hash(attestation_data)   │
         │                                │                               │
         │                                │    signature =                │
         │                                │      sign(attestation_hash)   │
         │                                │                               │
         │ 5. Return signed attestation   │                               │
         │    {                           │                               │
         │      attestation_data,         │                               │
         │      attestation_hash,         │                               │
         │      signature,                │                               │
         │      verifier_pubkey           │                               │
         │    }                           │                               │
         │<───────────────────────────────│                               │
         │                                │                               │
         │ 6. Submit proof to contract    │                               │
         │    submitIncomeProof({         │                               │
         │      employeeId,               │                               │
         │      attestation_data, ◄───────┼───────────────────────────────┼── Attestation passed
         │      attestation_hash,         │                               │   AS-IS (no threshold
         │      signature,                │                               │   parameter!)
         │      verifier_pubkey           │                               │
         │    })                          │                               │
         │────────────────────────────────┼──────────────────────────────>│
         │                                │                               │
         │                                │                               │ 7. Contract Validation
         │                                │                               │
         │                                │                               │ ✓ Verify verifier
  trusted
         │                                │                               │ ✓ Verify signature valid
         │                                │                               │ ✓ Verify hash matches
         │                                │                               │
         │                                │                               │ 8. Extract threshold
         │                                │                               │    FROM attestation
         │                                │                               │    (not from params!)
         │                                │                               │
         │                                │                               │    threshold =
         │                                │                               │      unpack(attestation)
         │                                │                               │
         │                                │                               │ 9. Store proof on ledger
         │                                │                               │    with extracted
  threshold
         │                                │                               │
         │ ✅ Proof submitted successfully│                               │
         │<───────────────────────────────┼───────────────────────────────│
         │                                │                               │
         │ 10. Share proof URL            │                               │
         │     /verify/{proofId}          │                               │
         │     (send to lender)           │                               │
         │                                │                               │


  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │                   PHASE 3: VERIFICATION (LENDER/PUBLIC FLOW)                         │
  └─────────────────────────────────────────────────────────────────────────────────────┘

      Lender/Landlord              Smart Contract (Public Read)
           │                                 │
           │ 11. Access proof URL            │
           │     /verify/{proofId}           │
           │                                 │
           │ 12. Fetch proof from contract   │
           │     verifyIncomeProof()         │
           │     - employeeId                │
           │     - requiredProofType: 1      │
           │     - requiredThreshold: $35k   │
           │────────────────────────────────>│
           │                                 │
           │                                 │ 13. Verify conditions
           │                                 │     ✓ Proof exists
           │                                 │     ✓ Proof type matches
           │                                 │     ✓ Threshold >= required
           │                                 │     ✓ Not expired
           │                                 │
           │ ✅ Verification result:         │
           │    "Employee income ≥ $40k"     │
           │    (proven, not expired)        │
           │<────────────────────────────────│
           │                                 │
           │ 14. Approve loan/lease          │
           │     (based on verified proof)   │
           │                                 │

  ---
  🔒 Security Analysis at Each Step

  Step 4: Attestation Creation (CRITICAL)

  # ZKML Verifier Service
  attestation_data = {
      'employee_id': '0xabc...',
      'proof_type': 1,  # INCOME_ABOVE_THRESHOLD
      'threshold_min': 40000,  # ← Threshold BOUND here
      'threshold_max': 0,
      'history_commitment': '0xdef...',
      'txids': ['0x123...', '0x456...'],
      'timestamp': 1762926243
  }

  # Pack into bytes (deterministic serialization)
  packed_data = pack(attestation_data)  # → Bytes<256>

  # Hash the packed data
  attestation_hash = hash(packed_data)  # → Bytes<32>

  # Sign the hash with verifier's private key
  signature = sign(attestation_hash, verifier_private_key)  # → Bytes<64>

  Security Guarantee: Threshold is cryptographically bound to attestation via signature

  ---
  Step 6: Employee Submits Proof

  ❌ OLD (VULNERABLE):
  // Employee could manipulate threshold
  await api.submitIncomeProof(
    employeeId,
    proofType: 1,
    thresholdMin: 100000,  // ← Employee lies! (proof was for $40k)
    thresholdMax: 0,
    txids,
    historyCommitment,
    attestationHash,
    signature,
    verifierPubkey
  );
  // Contract accepts it → SECURITY BREACH

  ✅ NEW (SECURE):
  // Employee submits attestation AS-IS (no threshold param)
  await api.submitIncomeProof(employeeId, {
    attestation_data: '0xabcdef...',  // ← Contains threshold $40k
    attestation_hash: '0x123...',
    signature: '0x456...',
    verifier_pubkey: '0x789...'
  });

  // Employee tries to modify attestation_data:
  attestation_data[threshold_offset] = 100000;  // ← Change $40k → $100k
  // → attestation_hash no longer matches
  // → Signature verification FAILS
  // → Contract REJECTS

  ---
  Step 8: Contract Extracts Threshold

  // Smart Contract (payroll.compact)
  export circuit submit_income_proof(
    employee_id: Bytes<32>,
    attestation_data: Bytes<256>,   // ← Packed attestation
    attestation_hash: Bytes<32>,
    signature: Bytes<64>,
    verifier_pubkey: Bytes<32>
  ): Boolean {

    // 1. Verify verifier is trusted
    if (!trusted_verifiers.member(disclose(verifier_pubkey))) {
      return false;
    }

    // 2. Verify signature (attestation_hash signed by verifier)
    if (!verify_signature(attestation_hash, signature, verifier_pubkey)) {
      return false;  // Invalid or tampered attestation
    }

    // 3. Verify hash matches data
    if (persistentHash(attestation_data) != attestation_hash) {
      return false;  // Data was modified
    }

    // 4. Extract threshold FROM attestation (employee cannot manipulate)
    const threshold_min = extract_threshold_min(attestation_data);
    const threshold_max = extract_threshold_max(attestation_data);

    // 5. Store proof with VERIFIED threshold
    income_proofs.insert(employee_id, IncomeProof {
      threshold_min: threshold_min,  // ← From signed attestation, not param!
      threshold_max: threshold_max,
      ...
    });

    return true;
  }

  Security Guarantee: Contract trusts threshold because it's extracted from verified attestation

  ---
  📦 Data Structures

  Attestation Data Format (Bytes<256>)

  Offset  | Size    | Field
  --------|---------|------------------
  0-31    | 32      | employee_id
  32      | 1       | proof_type (1=ABOVE_THRESHOLD, 2=RANGE, 3=AVERAGE, 4=CREDIT)
  33-40   | 8       | threshold_min (Uint<64>)
  41-48   | 8       | threshold_max (Uint<64>)
  49-80   | 32      | history_commitment
  81-464  | 384     | txids (12 × 32 bytes)
  465-468 | 4       | timestamp (Uint<32>)
  469-255 | -       | (reserved/padding)

  IncomeProof Record (On-Chain)

  struct IncomeProof {
    employee_id: Bytes<32>,
    proof_type: Uint<8>,
    threshold_min: Uint<64>,      // ← Extracted from attestation
    threshold_max: Uint<64>,      // ← Extracted from attestation
    txids: Vector<12, Bytes<32>>,
    history_commitment: Bytes<32>,
    attestation_hash: Bytes<32>,
    verifier_pubkey: Bytes<32>,
    submitted_at: Uint<32>,
    expires_at: Uint<32>
  }
