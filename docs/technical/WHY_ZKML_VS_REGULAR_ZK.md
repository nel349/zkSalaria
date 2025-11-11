# Why ZKML vs Regular ZK Proofs?

**TL;DR:** Regular ZK proofs prove the computation was correct. ZKML proves the computation was correct AND the input data was legitimate (from real blockchain transactions).

---

## The Two Trust Questions

### Question 1: "Did You Run the CORRECT MODEL?"
**Answer:** ✅ Regular ZK-SNARKs solve this
- Verification key is mathematically tied to the exact model
- Can't substitute a fake model without detection
- Cryptographically guaranteed

### Question 2: "Did You Use REAL DATA as Input?"
**Answer:** ⚠️ **This is where ZKML adds critical security**
- Regular ZK: No guarantee inputs are legitimate
- ZKML: Cryptographically binds inputs to blockchain transactions

---

## The Attack ZKML Prevents

### Without Data Binding (Regular ZK Proof):
```typescript
// Attacker creates FAKE payment history
fake_payments = [$100,000, $100,000, $100,000]  // FAKE!

// Runs REAL model on FAKE data
model(fake_payments) → score = 850

// Generates valid ZK proof
"My score > 680" ✅ (proof is mathematically valid, but based on lies!)
```

**Problem:** The proof is cryptographically correct, but meaningless because the input was fabricated.

**Why Regular ZK Can't Stop This:**
- ZK proofs only verify: "I executed function F on inputs X, output = Y"
- ZK proofs do NOT verify: "Inputs X came from a legitimate source"
- Attacker can generate valid proofs using any inputs they want

---

### With ZKML Data Binding (zkSalaria):
```compact
// Smart contract validates history commitment
const payment_history = employee_payment_history.lookup(employee_id);
const computed_commitment = persistentHash(payment_history);

assert(
  computed_commitment == history_commitment,
  "Proof not based on real blockchain data - REJECTED!"
);
```

**Security:** Employee **cannot** generate proofs using fake data because:
1. Contract has actual payment history stored on-chain (encrypted)
2. ZK proof must include `history_commitment` that matches real payments
3. Fake data → wrong commitment → proof rejected by smart contract
4. Blockchain transactions are immutable and cryptographically signed

---

## ZKML's Unique Security Properties

### 1. Cryptographic Data Provenance Chain
```
Company Wallet (on-chain)
  → Signed Transaction (cryptographic signature)
  → Employee Wallet (on-chain)
  → Payment Record (encrypted on ledger)
  → History Commitment (persistentHash of payment history)
  → ZK Proof (binds to this commitment)
  → Smart Contract (verifies commitment matches actual data)
```

**Result:** Proof can ONLY be generated using real blockchain payments.

### 2. Multi-Party Data Integrity
```
Company writes → Encrypted payment amounts → Stored on ledger
                                          → Employee decrypts locally
                                          → ML model runs on decrypted data
                                          → Proof binds to on-chain history
                                          → Contract validates commitment
```

**Result:** Company can't cheat, employee can't cheat, cryptography enforces honesty.

### 3. Zero-Knowledge Privacy with Data Authenticity
```
Traditional ZK:    Privacy ✅  |  Data Authenticity ❌
Oracle Systems:    Privacy ❌  |  Data Authenticity ✅
zkSalaria ZKML:    Privacy ✅  |  Data Authenticity ✅
```

---

## Comparison Table

| Property | Regular ZK | ZKML (zkSalaria) |
|----------|-----------|------------------|
| **Model correctness** | ✅ Verified | ✅ Verified |
| **Input data authenticity** | ❌ Not verified | ✅ **Blockchain-verified** |
| **Privacy** | ✅ Yes | ✅ Yes |
| **Attack resistance** | ⚠️ Can use fake inputs | ✅ **Inputs must be real blockchain txs** |
| **Trust model** | Trust math only | Trust math + blockchain consensus |
| **Use case validity** | ⚠️ Limited (can't trust results) | ✅ **Production-ready for financial verification** |

---

## Alternative Approaches (Why They Don't Work)

### Option A: Regular ZK Proof (No Data Binding)
```
✅ Model correctness proven
❌ Input data NOT verified
❌ Can use fake payment history
❌ Useless for financial verification
🚫 REJECTED
```

### Option B: Trusted Oracle (No ZK)
```
✅ Data from blockchain
❌ Oracle sees all private data
❌ No privacy for employee
❌ Centralization risk
🚫 REJECTED
```

### Option C: ZKML with History Commitments (zkSalaria)
```
✅ Model correctness proven
✅ Input data cryptographically bound to blockchain
✅ Privacy preserved (amounts stay encrypted)
✅ Decentralized verification
✅ Multi-party security (company + employee + verifier)
✅ CHOSEN SOLUTION
```

---

## The "BrickChain Problem"

**BrickChain Approach:** Hash documents to "prove" authenticity
- Problem: Hashing proves **existence**, not **legitimacy**
- Attack: Hash fake documents, claim they're real
- No verification of data source
- Anyone can hash anything

**zkSalaria ZKML Approach:** Bind proofs to blockchain transactions
- Transactions are cryptographically signed by employer
- Contract validates commitment matches actual ledger data
- Can't fake blockchain transactions (consensus prevents this)
- Immutable audit trail from payment to proof

---

## zkSalaria's Technical Innovation

### History Commitment Security Pattern:
```compact
// payroll.compact - submit_income_proof circuit
export circuit submit_income_proof(
  employee_id: Bytes<32>,
  proof_type: Uint<8>,
  threshold_min: Uint<64>,
  threshold_max: Uint<64>,
  txids: Vector<12, Bytes<32>>,
  history_commitment: Bytes<32>,  // ← THE CRITICAL BINDING
  attestation_hash: Bytes<32>,
  verifier_pubkey: Bytes<32>,
  timestamp: Uint<64>,
  expires_in: Uint<32>
): Boolean {

  // Get employee's ACTUAL payment history from ledger
  const payment_history = employee_payment_history.lookup(employee_id);

  // Compute commitment from REAL on-chain data
  const computed_commitment = persistentHash<Vector<12, PC_PaymentRecord>>(payment_history);

  // Verify submitted commitment matches actual history
  assert(
    computed_commitment == history_commitment,
    "Payment history mismatch - proof not based on real data"
  );

  // ... rest of verification logic
}
```

**This pattern is what makes zkSalaria impossible to cheat.**

---

## Real-World Security Implications

### Without ZKML (Regular ZK):
```
Employee applies for loan
  → Claims: "I earn $10,000/month"
  → Generates ZK proof with fake data
  → Proof is cryptographically valid
  → Lender approves loan
  → Employee defaults (income was fake)
  → System is broken
```

### With ZKML (zkSalaria):
```
Employee applies for loan
  → Claims: "I earn >$4,000/month"
  → Generates ZK proof using real blockchain payments
  → Proof includes history_commitment
  → Smart contract validates commitment matches actual on-chain data
  → Fake payments → wrong commitment → proof rejected
  → Lender only approves if proof uses real data
  → System is secure
```

---

## Why This Matters for zkSalaria

**The Problem We're Solving:**
- Employees need to prove income for loans/leases/credit
- Traditional systems require full disclosure (privacy violation)
- Self-reported data can be fabricated (security risk)

**ZKML Solution:**
- Prove income properties WITHOUT revealing exact amounts (privacy ✅)
- Cryptographically bind proofs to blockchain transactions (security ✅)
- Multi-party verification without trusted intermediaries (decentralization ✅)

**The Killer Feature:**
> ZKML creates an unbreakable chain from blockchain payments → employee computation → income proof → smart contract verification.

**Without ZKML:** You could prove "I ran a credit model" but not "I ran it on REAL salary data."

**With ZKML:** You prove both simultaneously, cryptographically.

---

## Summary: ZKML's Security Advantage

**Regular ZK Proofs:**
- Prove: "I executed computation C correctly"
- Don't prove: "I used legitimate inputs"
- Limited use case: Can't trust results for financial decisions

**ZKML (zkSalaria):**
- Prove: "I executed computation C correctly on blockchain-verified data D"
- Cryptographic guarantee: Inputs came from real transactions
- Production-ready: Suitable for high-stakes financial verification

**The Innovation:**
Data binding through history commitments transforms ZK proofs from "interesting math" to "legally enforceable financial verification."

---

## Technical References

- **ZKML Implementation:** `/zkml/payroll/` (EZKL proof generation)
- **Data Binding Logic:** `payroll-contract/src/payroll.compact:1061-1117` (submit_income_proof circuit)
- **Security Analysis:** `docs/technical/SECURITY_REVIEW_ZKML.md`
- **Complete Flow:** `docs/technical/ZKML-PAYROLL_VERIFICATION_FLOW.md`

---

**Built with cryptographic rigor for a privacy-first future.**
