/**
 * Developer Settings Utility
 * Manages developer/debug mode settings stored in localStorage
 */

const SETTINGS_KEY = 'payroll-ui.settings.developer';

export interface DeveloperSettings {
  showDebugPanel: boolean;
}

const DEFAULT_SETTINGS: DeveloperSettings = {
  showDebugPanel: true, // Enabled by default for backwards compatibility
};

/**
 * Get developer settings from localStorage
 */
export function getDeveloperSettings(): DeveloperSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch (error) {
    console.error('[DevSettings] Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save developer settings to localStorage
 */
export function saveDeveloperSettings(settings: Partial<DeveloperSettings>): void {
  try {
    const current = getDeveloperSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('[DevSettings] Failed to save settings:', error);
  }
}

/**
 * Check if debug panel should be shown
 */
export function shouldShowDebugPanel(): boolean {
  const settings = getDeveloperSettings();
  return settings.showDebugPanel;
}
