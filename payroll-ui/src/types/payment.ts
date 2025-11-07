// Payment metadata stored in localStorage
// This is off-chain data that company stores locally to track payment amounts
// (amounts are encrypted on-chain, so we store plaintext locally for UI display)

export interface PaymentMetadata {
  employeeId: string;           // Wallet address of employee
  employeeName: string;          // Display name
  amount: number;                // Payment amount in dollars (plaintext)
  paymentType: string;           // 'Regular Salary' | 'Bonus' | 'Advance'
  memo: string;                  // Internal note (optional)
  timestamp: number;             // Client-side timestamp (milliseconds since epoch)
  companyId: string;             // Contract address of company
}

export interface EmployeeMetadata {
  employeeId: string;            // Wallet address
  name: string;                  // Display name
  email: string;                 // Contact email
  role?: string;                 // Job title (optional)
  baseSalary?: string;           // Monthly salary (optional)
  addedAt: string;               // ISO timestamp when added
  companyContractAddress: string; // Contract address
}
