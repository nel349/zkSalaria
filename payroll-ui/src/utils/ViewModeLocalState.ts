/**
 * View Mode Local State (Phase 3.6)
 * Persists user's selected view (company vs employee) for dual-role users
 */

export type ViewMode = 'company' | 'employee';

const STORAGE_KEY = 'payroll-ui.selectedView';

/**
 * Get the currently selected view mode from localStorage
 * @returns The selected view mode, or 'company' as default
 */
export const getSelectedView = (): ViewMode => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'company' || stored === 'employee') {
    return stored;
  }
  // Default to company view
  return 'company';
};

/**
 * Set the selected view mode in localStorage
 * @param view The view mode to store
 */
export const setSelectedView = (view: ViewMode): void => {
  localStorage.setItem(STORAGE_KEY, view);
};

/**
 * Clear the selected view from localStorage
 */
export const clearSelectedView = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
