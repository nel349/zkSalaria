  ✅ Correct Understanding: No Compact Witnesses in zkSalaria

  Looking at grant_income_disclosure (payroll.compact:378-383):

  export circuit grant_income_disclosure(
    employee_id: Bytes<32>,
    lender_id: Bytes<32>,
    min_threshold: Uint<64>,
    expires_in: Uint<32>
  ): [] {
    // All parameters are PUBLIC circuit inputs
    // No witnesses involved!

  All parameters are regular circuit inputs, NOT witnesses.

  And from your contract design (index.ts:30-34):
  // Payroll witness functions
  // NOTE: All witness functions removed - following bank.compact pattern
  // Payment history is stored on public ledger so company can update
  export const payrollWitnesses = {
    // No witnesses needed - all data on ledger (encrypted balances + payment history)
  };

  🔍 The Real Architecture

  Compact Witnesses vs. ZKML Witnesses - DIFFERENT THINGS

  | Type              | Where Used                 | Purpose
   |
  |-------------------|----------------------------|------------------------------------------------
  -|
  | Compact Witnesses | In Compact smart contracts | Private state for ZK proofs within the contract
   |
  | ZKML Witnesses    | Off-chain (EZKL)           | Input data for ML model proving
   |

  zkSalaria Design: Bank Pattern (No Compact Witnesses)

  ┌─────────────────────────────────────────────────┐
  │ PUBLIC LEDGER (Encrypted)                       │
  │ ✅ Encrypted employee balances                  │
  │ ✅ Encrypted payment history                    │
  │ ✅ Disclosure authorizations                    │
  │ ✅ Income proof attestations (hashes)           │
  └─────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────┐
  │ PRIVATE STATE (Minimal)                         │
  │ ⚠️ Empty - no witnesses needed                  │
  └─────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────┐
  │ OFF-CHAIN (Browser)                             │
  │ ✅ Decryption keys                              │
  │ ✅ Decrypted payment amounts                    │
  │ ✅ EZKL proof generation (ZKML witnesses)       │
  └─────────────────────────────────────────────────┘

  🎯 When Will zkSalaria Need Witnesses? ANSWER: NEVER (for Compact)

  Your contract will NEVER use Compact witnesses because:

  1. ✅ Bank.compact pattern: Everything on encrypted ledger
  2. ✅ No private state needed: Decryption happens client-side
  3. ✅ ZKML proofs are off-chain: EZKL runs in browser/verifier service

  What Actually Happens with Income Proofs:

  Phase 3.4 - Generate Income Proof Flow:

  // 1. BROWSER: Decrypt locally (NOT a Compact witness)
  const decryptedAmounts = employee.decrypt(encryptedPaymentHistory);

  // 2. BROWSER: Generate EZKL proof (OFF-CHAIN ZK proof)
  const zkmlProof = await EZKL.prove({
    inputs: decryptedAmounts,  // ← This is "witness" for EZKL, NOT Compact
    model: incomeVerificationModel,
    threshold: 4000
  });

  // 3. SUBMIT TO CONTRACT: Only the proof hash
  await api.submitIncomeProof(
    employeeId,
    proofType: 1,  // INCOME_ABOVE_THRESHOLD
    thresholdMin: 4000,
    merkleRoot: zkmlProof.merkleRoot,
    attestationHash: zkmlProof.hash,  // ← Just the hash, not the data!
    verifierPubkey,
    timestamp,
    expiresIn: 2592000
  );

  All circuit parameters are PUBLIC (disclosed):
  - employee_id - disclosed
  - threshold_min - disclosed (you're claiming ≥ $4,000)
  - attestation_hash - disclosed (EZKL proof hash)
  - NO witnesses needed!

  📋 Features That Need OFF-CHAIN Witnesses (Not Compact Witnesses)

  | Feature                     | On-Chain Circuit            | Off-Chain Witness (EZKL)    |
  Compact Witness? |
  |-----------------------------|-----------------------------|-----------------------------|-------
  -----------|
  | Generate Income Proof       | submit_income_proof         | Decrypted payment amounts   | ❌ NO
              |
  | Grant Income Disclosure     | grant_income_disclosure     | None (just authorization)   | ❌ NO
              |
  | Grant Employment Disclosure | grant_employment_disclosure | None (just authorization)   | ❌ NO
              |
  | Verify Income Proof         | verify_income_proof         | None (reads on-chain proof) | ❌ NO
              |

  🔑 Corrected Summary

  Your initial understanding was correct!

  1. ✅ Witnesses in Compact = Private state data used IN the smart contract
  2. ✅ zkSalaria doesn't need these because bank.compact pattern uses encrypted ledger
  3. ✅ "Witnesses" you mentioned = Off-chain data for EZKL/ZKML (totally different)
  4. ✅ All data interactions happen via regular circuit parameters (disclosed) or encrypted ledger
  reads

  The only "witness-like" data is:
  - Decrypted payment amounts in browser (for EZKL input)
  - EZKL model inputs (off-chain ML proving)
  - None of this touches Compact witnesses!

  Great question - this clarifies the architecture perfectly! 🎯