// Environment detection and adaptation utilities

// Global declarations
declare global {
  var __IS_EXTENSION__: boolean | undefined;
  var chrome: any;
}

export const isExtension = typeof __IS_EXTENSION__ !== 'undefined' && __IS_EXTENSION__;

// Chrome Storage API adapter
export class StorageAdapter {
  static async get(key: string): Promise<any> {
    if (isExtension && typeof chrome !== 'undefined') {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result: any) => {
          const value = result[key];
          if (typeof value === 'undefined' || value === null) {
            // Fallback to localStorage mirror if any
            const mirrored = localStorage.getItem(key);
            resolve(mirrored ? JSON.parse(mirrored) : null);
          } else {
            resolve(value);
          }
        });
      });
    } else {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
  }

  static async set(key: string, value: any): Promise<void> {
    if (isExtension && typeof chrome !== 'undefined') {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => {
          try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
          resolve();
        });
      });
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  static async remove(key: string): Promise<void> {
    if (isExtension && typeof chrome !== 'undefined') {
      return new Promise((resolve) => {
        chrome.storage.local.remove([key], resolve);
      });
    } else {
      localStorage.removeItem(key);
    }
  }
}

// Analytics adapter
export const Analytics = {
  track: (event: string, properties?: any) => {
    if (!isExtension) {
      // Use Vercel Analytics only on Web
      if (typeof window !== 'undefined' && (window as any).va) {
        (window as any).va(event, properties);
      }
    }
    // In extension env either integrate other analytics or no-op
  }
};

// Fetch adapter with minimal CORS adjustments for extension
export const fetchWithCORS = async (url: string, options?: RequestInit): Promise<Response> => {
  if (isExtension && typeof chrome !== 'undefined') {
    // In MV3 most requests work with origin=* query; avoid forcing Origin header
    return fetch(url, options);
  }
  return fetch(url, options);
}; 