export type SavedCompany = {
  contractAddress: string;
  name: string;
  industry?: string;
  size?: string;
  email?: string;
  walletAddress: string;
  createdAt: string; // ISO
  lastUsedAt?: string; // ISO
};

const COMPANIES_KEY = 'payroll-ui.companies';

// Company storage functions
function readAllCompanies(): SavedCompany[] {
  try {
    const raw = window.localStorage.getItem(COMPANIES_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SavedCompany[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAllCompanies(list: SavedCompany[]): void {
  window.localStorage.setItem(COMPANIES_KEY, JSON.stringify(list));
}

export function listCompanies(): SavedCompany[] {
  return readAllCompanies().sort((a, b) => (b.lastUsedAt ?? b.createdAt).localeCompare(a.lastUsedAt ?? a.createdAt));
}

export function saveCompany(entry: SavedCompany): void {
  const all = readAllCompanies();
  const without = all.filter((c) => c.contractAddress !== entry.contractAddress);
  writeAllCompanies([entry, ...without]);
}

export function touchCompany(contractAddress: string): void {
  const all = readAllCompanies();
  const idx = all.findIndex((c) => c.contractAddress === contractAddress);
  if (idx >= 0) {
    all[idx] = { ...all[idx], lastUsedAt: new Date().toISOString() };
    writeAllCompanies(all);
  }
}

export function getCompany(contractAddress: string): SavedCompany | undefined {
  return readAllCompanies().find((c) => c.contractAddress === contractAddress);
}

// Get the most recently used company (for auto-selecting)
export function getMostRecentCompany(): SavedCompany | undefined {
  const companies = listCompanies();
  return companies.length > 0 ? companies[0] : undefined;
}

// Utility functions for current session (following pay-ui pattern)
export function getCurrentCompany(): string | null {
  try {
    return window.sessionStorage.getItem('current-company');
  } catch {
    return null;
  }
}

export function setCurrentCompany(contractAddress: string): void {
  try {
    window.sessionStorage.setItem('current-company', contractAddress);
    touchCompany(contractAddress);
  } catch {
    // Ignore storage errors
  }
}

// Development helper: Clear all company state for fresh start
export function clearAllCompanyState(): void {
  try {
    // Clear localStorage
    window.localStorage.removeItem(COMPANIES_KEY);

    // Clear sessionStorage
    window.sessionStorage.removeItem('current-company');

    // Clear legacy keys
    window.localStorage.removeItem('payroll_contract_address');
    window.localStorage.removeItem('company_data');
    window.localStorage.removeItem('user_role');

    console.log('🧹 All company state cleared - refresh page for fresh start');
  } catch (error) {
    console.error('Failed to clear company state:', error);
  }
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).clearCompanyState = clearAllCompanyState;
}

// Legacy migration: Import old single company from localStorage
export function migrateLegacyCompany(): void {
  const legacyAddress = localStorage.getItem('payroll_contract_address');
  const legacyData = localStorage.getItem('company_data');

  if (legacyAddress && legacyData) {
    try {
      const data = JSON.parse(legacyData);
      const existing = getCompany(legacyAddress);

      if (!existing) {
        saveCompany({
          contractAddress: legacyAddress,
          name: data.name || 'Unknown Company',
          industry: data.industry,
          size: data.size,
          email: data.email,
          walletAddress: data.walletAddress,
          createdAt: new Date().toISOString(),
        });
      }

      // Set as current company
      setCurrentCompany(legacyAddress);

      // Remove legacy keys after migration
      localStorage.removeItem('payroll_contract_address');
      localStorage.removeItem('company_data');
    } catch (err) {
      console.warn('Failed to migrate legacy company data:', err);
    }
  }
}
