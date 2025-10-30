# zkSalaria Implementation Todo List

**Project:** zkSalaria - ZKML-Powered Private Payroll
**Track:** Finance - Midnight Hackathon
**Timeline:** 3 weeks (Nov 2025)

---

## Phase 1: Core Payroll Infrastructure

### Smart Contracts
- [ ] Read and understand existing pay.compact contract structure
- [ ] Create PayrollCommons.compact with zkSalaria-specific types
- [ ] Modify pay.compact to PayrollRegistry (company/employee registration)
- [ ] Build PrivatePayroll circuits (shielded salary transfers)
- [ ] Add batch payment processing for multiple employees
- [ ] Run npm run compile to test contract compilation
- [ ] Fix any Compact compilation errors

### API Layer
- [ ] Update pay-api to work with new payroll contracts
- [ ] Test private payroll with local deployment

---

## Phase 2: ZKML Integration

### ML Models
- [ ] Set up Python zkml workspace with EZKL dependencies
- [ ] Build XGBoost credit scoring model with synthetic data
- [ ] Export model to ONNX format
- [ ] Generate ZK circuit from ONNX using EZKL

### Smart Contracts
- [ ] Create CreditScoring.compact for ZKML proof verification
- [ ] Integrate ZKML proof generation with payroll-api
- [ ] Test end-to-end: payment → ML analysis → proof → verification

---

## Phase 3: UI Development

- [ ] Update pay-ui to show credit scoring feature
- [ ] Build employee credit score checker UI

---

## Phase 4: Deployment & Demo

- [ ] Deploy contracts to Midnight testnet
- [ ] Create demo with 50 employees on testnet

---

**Status:** Phase 1 - Smart Contracts (In Progress)
**Current Task:** Read and understand existing contract structure
**Next:** Modify PayrollCommons.compact
