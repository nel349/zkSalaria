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
         │    POST /api/zkml/generate-proof                               │
         │    - employeeId                │                               │
         │    - proofType: 2              │                               │
         │    - thresholdMin: 8.0 (norm)  │◄──────────────────────────────┼── Employee sets
         │    - thresholdMax: 12.0 (norm) │                               │   desired threshold
         │    - payments: [1,1,1,1,1,1]   │                               │   (6 months normalized)
         │    - txids: [...]              │                               │
         │    - historyCommitment         │                               │
         │    - contract_address          │                               │
         │───────────────────────────────>│                               │
         │                                │                               │
         │                                │ 3. Generate ZKML Proof        │
         │                                │    (using EZKL)               │
         │                                │    - Proves: annualized       │
         │                                │      6mo income (120k/yr)     │
         │                                │      is within [80k, 120k]    │
         │                                │    - Without revealing amount │
         │                                │    - Returns: proof.json      │
         │                                │                               │
         │                                │ 4. Create Attestation         │
         │                                │    (CRITICAL STEP)            │
         │                                │                               │
         │                                │    attestation = {            │
         │                                │      employee_id,             │
         │                                │      proof_type: 2,           │
         │                                │      threshold_min: 8.0, ◄────┼── Threshold BOUND
         │                                │      threshold_max: 12.0,     │   inside attestation
         │                                │      txids: [...],            │
         │                                │      history_commitment,      │
         │                                │      timestamp,               │
         │                                │      proof_json               │
         │                                │    }                          │
         │                                │                               │
         │                                │    attestation_hash =         │
         │                                │      hash(attestation)        │
         │                                │                               │
         │                                │ 5. Submit to Blockchain       │
         │                                │    (Verifier does this!)      │
         │                                │                               │
         │                                │    api.submitIncomeProof(     │
         │                                │      employeeId,              │
         │                                │      proofType: 2n,           │
         │                                │      thresholdMin: "8.0",     │
         │                                │      thresholdMax: "12.0",    │
         │                                │      txids,                   │
         │                                │      historyCommitment,       │
         │                                │      attestation_hash,        │
         │                                │      timestamp,               │
         │                                │      expiresIn: 30 days       │
         │                                │    )                          │
         │                                │───────────────────────────────>│
         │                                │                               │
         │                                │                               │ 6. Contract Validation
         │                                │                               │
         │                                │                               │ ✓ Verify verifier trusted
         │                                │                               │ ✓ Verify witness derives
         │                                │                               │   verifierPubkey
         │                                │                               │ ✓ Verify attestation_hash
         │                                │                               │
         │                                │                               │ 7. Store proof on ledger
         │                                │                               │
         │                                │                               │    income_proofs[empId] = {
         │                                │                               │      proof_type: 2,
         │                                │                               │      threshold_min: 8.0,
         │                                │                               │      threshold_max: 12.0,
         │                                │                               │      attestation_hash,
         │                                │                               │      submitted_at,
         │                                │                               │      expires_at
         │                                │                               │    }
         │                                │                               │
         │                                │  ✅ Success                   │
         │                                │<───────────────────────────────│
         │                                │                               │
         │ 8. Return success response     │                               │
         │    {                           │                               │
         │      success: true,            │                               │
         │      attestation: {            │                               │
         │        attestation_hash,       │                               │
         │        timestamp               │                               │
         │      }                         │                               │
         │    }                           │                               │
         │<───────────────────────────────│                               │
         │                                │                               │
         │ 9. Share proof with lender     │                               │
         │    (lender uses contract       │                               │
         │     to verify via public read) │                               │
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

  Step 3-4: ZKML Proof Generation & Attestation Creation (CRITICAL)

  # ZKML Verifier Service (zkml-verifier/src/routes/verify.ts)

  // 1. Generate ZKML proof using EZKL
  const proofResult = await generateIncomeProof(
    proofType,        // 2 = INCOME_RANGE
    payments,         // [1.0, 1.0, 1.0, 1.0, 1.0, 1.0] (normalized)
    thresholdMin,     // 8.0 (80k/year normalized)
    thresholdMax      // 12.0 (120k/year normalized)
  );

  // EZKL model annualizes 6-month total (6.0 * 2 = 12.0) and checks:
  // ✓ 12.0 >= 8.0 (min) ✓ 12.0 <= 12.0 (max)
  // Returns: { success: true, proof: zkmlProof }

  // 2. Create attestation binding proof to parameters
  const attestation = {
    employee_id: employeeId,
    proof_type: proofType,           // 2
    threshold_min: thresholdMin,     // 8.0 ← BOUND HERE
    threshold_max: thresholdMax,     // 12.0 ← BOUND HERE
    txids: txids,
    history_commitment: historyCommitment,
    timestamp: Date.now() / 1000,
    proof_json: JSON.stringify(proofResult.proof)
  };

  // 3. Hash attestation for integrity
  const attestation_hash = hashAttestation(attestation);

  Security Guarantee: Threshold cryptographically bound to ZKML proof via attestation

  ---
  Step 5: Verifier Service Submits to Blockchain (SECURE BY DESIGN)

  ✅ SECURE FLOW:
  // Verifier service (NOT employee) submits to blockchain
  // This eliminates manipulation vector entirely!

  const success = await api.submitIncomeProof(
    employeeId,
    BigInt(proofType),              // 2
    thresholdMin.toString(),        // "8.0" ← From attestation
    thresholdMax.toString(),        // "12.0" ← From attestation
    txids,
    historyCommitment,
    attestation.attestation_hash,
    BigInt(attestation.timestamp),
    30 * 24 * 60 * 60              // 30 days expiry
  );

  Security Guarantees:
  1. Employee cannot manipulate submission - verifier does it
  2. Verifier wallet (VERIFIER_SEED) signs the transaction
  3. Witness derives verifierPubkey from transaction context
  4. Contract validates verifier is trusted before accepting
  5. Thresholds in submission match ZKML proof parameters

  ❌ ATTACK PREVENTED:
  // Employee cannot intercept and modify thresholds
  // because they never submit to blockchain directly!

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
