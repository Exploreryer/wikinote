// 环境检测和适配工具

// 声明全局变量
declare global {
  var __IS_EXTENSION__: boolean | undefined;
  var chrome: any;
}

export const isExtension = typeof __IS_EXTENSION__ !== 'undefined' && __IS_EXTENSION__;

// Chrome Storage API 适配
export class StorageAdapter {
  static async get(key: string): Promise<any> {
    if (isExtension && typeof chrome !== 'undefined') {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result: any) => {
          resolve(result[key]);
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
        chrome.storage.local.set({ [key]: value }, resolve);
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

// Analytics 适配
export const Analytics = {
  track: (event: string, properties?: any) => {
    if (!isExtension) {
      // 只在Web环境下使用Vercel Analytics
      if (typeof window !== 'undefined' && (window as any).va) {
        (window as any).va(event, properties);
      }
    }
    // Extension环境下可以集成其他分析服务或跳过
  }
};

// 网络请求适配
export const fetchWithCORS = async (url: string, options?: RequestInit): Promise<Response> => {
  if (isExtension && typeof chrome !== 'undefined') {
    // Extension环境下添加必要的headers
    const modifiedOptions = {
      ...options,
      headers: {
        ...options?.headers,
        'Origin': chrome.runtime.getURL(''),
      },
    };
    return fetch(url, modifiedOptions);
  } else {
    return fetch(url, options);
  }
}; 