import { isCROSSxEnvironment, getEnvironmentType } from './detector.js';
import { WebAppImpl } from './webapp/index.js';
import { WebAppMock } from './mock/index.js';
import type { IWebApp } from './types.js';

const VERSION = '__VERSION__';

/**
 * Create WebApp instance based on environment
 */
function createWebApp(): IWebApp {
  const environment = getEnvironmentType();

  if (environment === 'crossx') {
    console.log('[CROSSx WebApp] Initializing in CROSSx environment');
    return new WebAppImpl(VERSION);
  } else {
    console.log('[CROSSx WebApp] Initializing in mock/browser environment');
    return new WebAppMock(VERSION);
  }
}

// Initialize WebApp
const webApp = createWebApp();

// Create global namespace if not exists
if (typeof window !== 'undefined') {
  const crossx = (window.CROSSx as any) || ({} as any);
  crossx.WebApp = webApp;
  (window as any).CROSSx = crossx;

  // Make version read-only
  Object.defineProperty(crossx.WebApp, 'version', {
    value: VERSION,
    writable: false,
    configurable: false
  });
}

// Export for module usage
export const CROSSxWebApp = webApp;

// Type exports
export type { IWebApp, INativeBridge, WebAppEventType } from './types.js';
export { Haptics } from './types.js';
export { isCROSSxEnvironment, getEnvironmentType } from './detector.js';

// Default export
export default CROSSxWebApp;

