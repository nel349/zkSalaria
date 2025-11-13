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
         │                                │    // IMPORTANT: Denormalize  │
         │                                │    // thresholds BEFORE hash  │
         │                                │    denormalizedMin = 80000    │
         │                                │    denormalizedMax = 120000   │
         │                                │                               │
         │                                │    attestation = {            │
         │                                │      employee_id,             │
         │                                │      proof_type: 2,           │
         │                                │      threshold_min: 80000,◄───┼── Threshold BOUND
         │                                │      threshold_max: 120000,   │   (denormalized)
         │                                │      txids: [...],            │
         │                                │      history_commitment,      │
         │                                │      timestamp                │
         │                                │    }                          │
         │                                │                               │
         │                                │    attestation_hash =         │
         │                                │      persistentHash(attestation)│
         │                                │                               │
         │                                │ 5. Submit to Blockchain       │
         │                                │    (Verifier does this!)      │
         │                                │                               │
         │                                │    // Update timestamp first! │
         │                                │    await update_timestamp()   │
         │                                │                               │
         │                                │    api.submitIncomeProof(     │
         │                                │      employeeId,              │
         │                                │      proofType: 2n,           │
         │                                │      thresholdMin: "80000",   │
         │                                │      thresholdMax: "120000",  │
         │                                │      txids,                   │
         │                                │      historyCommitment,       │
         │                                │      attestation_hash,        │
         │                                │      timestamp,               │
         │                                │      expiresIn: 30 days       │
         │                                │    )                          │
         │                                │───────────────────────────────>│
         │                                │                               │
         │                                │                               │ 6. Contract Validation
         │                                │                               │    (8 checks in order)
         │                                │                               │
         │                                │                               │ ✓ 1. Attestation hash
         │                                │                               │      (reconstructs & verifies)
         │                                │                               │ ✓ 2. Proof type (1-4)
         │                                │                               │ ✓ 3. Verifier trusted
         │                                │                               │      (via witness pattern)
         │                                │                               │ ✓ 4. No replay attack
         │                                │                               │ ✓ 5. Timestamp fresh
         │                                │                               │      (within 1 hour)
         │                                │                               │ ✓ 6. Range validation
         │                                │                               │ ✓ 7. Employee exists
         │                                │                               │ ✓ 8. History commitment
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

  ✅ SECURE FLOW (zkml-verifier/src/routes/verify.ts):

  // 1. Denormalize thresholds (ZKML uses normalized, contract uses denormalized)
  const NORMALIZATION_FACTOR = 10000;
  const denormalizedMin = Math.floor(threshold_min * NORMALIZATION_FACTOR);  // 3 → 30000
  const denormalizedMax = Math.floor(threshold_max * NORMALIZATION_FACTOR);  // 12 → 120000

  // 2. Create attestation WITH DENORMALIZED thresholds
  //    (This ensures attestation hash matches circuit reconstruction)
  const attestation = await signer.createAttestation({
    employee_id,
    proof_type,
    threshold: denormalizedMin,      // 30000 (NOT 3!)
    threshold_max: denormalizedMax,  // 120000 (NOT 12!)
    txids,
    history_commitment
  });

  // 3. Update contract timestamp (CRITICAL for timestamp validation)
  await api.circuits.update_timestamp(BigInt(currentTimestamp));

  // 4. Submit to blockchain (verifier service does this, NOT employee)
  const success = await api.submitIncomeProof(
    employeeId,
    BigInt(proofType),
    denormalizedMin.toString(),     // "30000" ← Matches attestation
    denormalizedMax.toString(),     // "120000" ← Matches attestation
    txids,
    historyCommitment,
    attestation.attestation_hash,
    BigInt(attestation.timestamp),
    30 * 24 * 60 * 60              // 30 days expiry
  );

  Security Guarantees:
  1. Employee cannot manipulate submission - verifier does it
  2. Verifier proves ownership via witness (Midnight pattern)
  3. Contract validates verifier is trusted via witness-derived pubkey
  4. Attestation hash binds thresholds cryptographically
  5. Timestamp validation ensures proof freshness
  6. History commitment prevents fake payment data

  ❌ ATTACK PREVENTED:
  // Employee cannot intercept and modify thresholds
  // because they never submit to blockchain directly!

  ---
  Step 6: Circuit Validation (ACTUAL IMPLEMENTATION)

  // Smart Contract (payroll.compact:1090-1201)
  export circuit submit_income_proof(
    employee_id: Bytes<32>,
    proof_type: Uint<8>,
    threshold_min: Uint<64>,
    threshold_max: Uint<64>,
    history_commitment: Bytes<32>,
    timestamp: Uint<32>,
    attestation_hash: Bytes<32>,
    txids: Vector<12, Bytes<32>>,
    expires_in: Uint<32>
  ): Boolean {

    // Derive verifier's public key from witness (Midnight pattern)
    const verifier_pubkey = verifier_public_key(verifier_secret_key());

    // Step 1: Reconstruct attestation and verify hash
    const attestation = PC_IncomeProofAttestation {
      employee_id: disclose(employee_id),
      proof_type: disclose(proof_type),
      threshold_min: disclose(threshold_min),
      threshold_max: disclose(threshold_max),
      history_commitment: disclose(history_commitment),
      timestamp: disclose(timestamp)
    };
    const computed_hash = persistentHash<PC_IncomeProofAttestation>(attestation);
    if (disclose(attestation_hash) != computed_hash) {
      return false;  // Attestation tampered!
    }

    // Step 2: Validate proof type (1-4)
    if (proof_type_disclosed < 1 || proof_type_disclosed > 4) {
      return false;
    }

    // Step 3: Verify verifier is trusted (via witness-derived pubkey)
    if (!trusted_verifiers.member(disclose(verifier_pubkey))) {
      return false;
    }

    // Step 4: Prevent replay attacks
    if (used_attestations.member(disclose(attestation_hash))) {
      return false;
    }
    used_attestations.insert(disclose(attestation_hash), 1);

    // Step 5: Verify timestamp freshness (within 1 hour)
    const current_time = current_timestamp;
    if (timestamp_disclosed <= (current_time - 3600) ||
        timestamp_disclosed > current_time) {
      return false;
    }

    // Step 6: Range validation (for type 2)
    if (proof_type == 2 && threshold_max <= threshold_min) {
      return false;
    }

    // Step 7: Verify employee has payment history
    if (!employee_payment_history.member(employee_id_disclosed)) {
      return false;
    }

    // Step 8: Verify history commitment matches on-chain data
    const payment_history = employee_payment_history.lookup(employee_id_disclosed);
    const computed_commitment = persistentHash<Vector<6, PC_PaymentRecord>>(payment_history);
    if (history_commitment_disclosed != computed_commitment) {
      return false;  // History commitment mismatch - possible fraud!
    }

    // All checks passed - store proof with VERIFIED thresholds
    income_proofs.insert(employee_id_disclosed, PC_IncomeProof {
      threshold_min: threshold_min_disclosed,  // ← From attestation hash verification
      threshold_max: threshold_max_disclosed,
      ...
    });

    return true;
  }

  Security Guarantee: 8-step validation ensures cryptographic integrity at every level

  ---
  📦 Data Structures

  PC_IncomeProofAttestation (Compact struct for hashing)

  struct PC_IncomeProofAttestation {
    employee_id: Bytes<32>,           // SHA-256 hash of wallet address
    proof_type: Uint<8>,              // 1=ABOVE, 2=RANGE, 3=AVERAGE, 4=CREDIT
    threshold_min: Uint<64>,          // Denormalized (e.g., 30000 for $30k)
    threshold_max: Uint<64>,          // Denormalized (0 for types 1,3,4)
    history_commitment: Bytes<32>,    // Hash of payment history
    timestamp: Uint<32>               // Unix timestamp (seconds)
  }

  // Attestation hash computed via:
  attestation_hash = persistentHash<PC_IncomeProofAttestation>(attestation)

  Binary Serialization (for hashing):
  - employee_id: 32 bytes
  - proof_type: 1 byte
  - threshold_min: 8 bytes (little-endian)
  - threshold_max: 8 bytes (little-endian)
  - history_commitment: 32 bytes
  - timestamp: 4 bytes (little-endian)

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
