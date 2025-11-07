/**
 * Employer Contracts Storage (for employees)
 * Stores company contracts where current wallet is an employee
 */

export type EmployerContract = {
  contractAddress: string;
  companyName: string;
  joinedAt: string; // ISO timestamp
  lastUsedAt?: string; // ISO timestamp
};

const EMPLOYERS_KEY = 'payroll-ui.employer-contracts';
const CURRENT_EMPLOYER_KEY = 'payroll-ui.current-employer';

// Get current employer contract address
export function getCurrentEmployer(): string | null {
  try {
    return localStorage.getItem(CURRENT_EMPLOYER_KEY);
  } catch {
    return null;
  }
}

// Set current employer contract address
export function setCurrentEmployer(contractAddress: string): void {
  try {
    localStorage.setItem(CURRENT_EMPLOYER_KEY, contractAddress);
  } catch (err) {
    console.error('Failed to set current employer:', err);
  }
}

// Clear current employer
export function clearCurrentEmployer(): void {
  try {
    localStorage.removeItem(CURRENT_EMPLOYER_KEY);
  } catch (err) {
    console.error('Failed to clear current employer:', err);
  }
}

// Read all employer contracts for current wallet
function readAllEmployers(walletAddress: string): EmployerContract[] {
  try {
    const key = `${EMPLOYERS_KEY}.${walletAddress}`;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw) as EmployerContract[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// Write all employer contracts
function writeAllEmployers(walletAddress: string, list: EmployerContract[]): void {
  try {
    const key = `${EMPLOYERS_KEY}.${walletAddress}`;
    localStorage.setItem(key, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to write employer contracts:', err);
  }
}

// List all employer contracts (sorted by last used)
export function listEmployers(walletAddress: string): EmployerContract[] {
  return readAllEmployers(walletAddress).sort(
    (a, b) => (b.lastUsedAt ?? b.joinedAt).localeCompare(a.lastUsedAt ?? a.joinedAt)
  );
}

// Save new employer contract
export function saveEmployer(walletAddress: string, contract: EmployerContract): void {
  const all = readAllEmployers(walletAddress);
  const without = all.filter((c) => c.contractAddress !== contract.contractAddress);
  writeAllEmployers(walletAddress, [contract, ...without]);
}

// Touch employer contract (update lastUsedAt)
export function touchEmployer(walletAddress: string, contractAddress: string): void {
  const all = readAllEmployers(walletAddress);
  const idx = all.findIndex((c) => c.contractAddress === contractAddress);
  if (idx >= 0) {
    all[idx] = { ...all[idx], lastUsedAt: new Date().toISOString() };
    writeAllEmployers(walletAddress, all);
  }
}

// Get specific employer contract
export function getEmployer(walletAddress: string, contractAddress: string): EmployerContract | undefined {
  return readAllEmployers(walletAddress).find((c) => c.contractAddress === contractAddress);
}

// Check if contract exists in employer list
export function hasEmployer(walletAddress: string, contractAddress: string): boolean {
  return getEmployer(walletAddress, contractAddress) !== undefined;
}

// Clear all employer contracts for wallet
export function clearAllEmployers(walletAddress: string): void {
  try {
    const key = `${EMPLOYERS_KEY}.${walletAddress}`;
    localStorage.removeItem(key);
  } catch (err) {
    console.error('Failed to clear employer contracts:', err);
  }
}
