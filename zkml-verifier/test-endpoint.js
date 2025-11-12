// Quick test of the /generate-proof endpoint
const testData = {
  proof_type: 2,
  payments: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0], // $10k/month normalized → 6 months = $60k → annualized = $120k/year
  threshold_min: 8.0,  // $80k/year normalized
  threshold_max: 12.0,  // $120k/year normalized
  employee_id: "test-employee",
  txids: ["tx1", "tx2", "tx3", "tx4", "tx5", "tx6"],
  history_commitment: "test-commitment-hash"
  // contract_address omitted - skips blockchain submission for testing
};

console.log('Sending request to verifier with data:', JSON.stringify(testData, null, 2));

fetch('http://localhost:3002/api/zkml/generate-proof', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => {
  console.log('Response status:', res.status);
  return res.json();
})
.then(data => {
  console.log('Response body:', JSON.stringify(data, null, 2));
})
.catch(err => {
  console.error('Error:', err);
});
