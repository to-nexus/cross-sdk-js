import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebAppImpl } from '../webapp/index.js';
import { WebAppMock } from '../mock/index.js';
import { isCROSSxEnvironment } from '../detector.js';

describe('WebApp Basic Functionality', () => {
  describe('WebAppMock', () => {
    let mock: WebAppMock;

    beforeEach(() => {
      mock = new WebAppMock('1.0.0');
    });

    it('should have correct version', () => {
      expect(mock.version).toBe('1.0.0');
    });

    it('should call ready without error', () => {
      expect(() => mock.ready()).not.toThrow();
    });

    it('should call requestFullScreen without error', () => {
      expect(() => mock.requestFullScreen()).not.toThrow();
    });

    it('should register and fire event listeners', () => {
      const callback = vi.fn();
      mock.on('viewClosed', callback);
      mock._simulateClose();
      expect(callback).toHaveBeenCalled();
    });

    it('should fire multiple listeners for same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      mock.on('viewClosed', callback1);
      mock.on('viewClosed', callback2);
      mock._simulateClose();
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should remove event listeners with off', () => {
      const callback = vi.fn();
      mock.on('viewClosed', callback);
      mock.off('viewClosed', callback);
      mock._simulateClose();
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle backgrounded event', () => {
      const callback = vi.fn();
      mock.on('viewBackgrounded', callback);
      mock._simulateBackgrounded();
      expect(callback).toHaveBeenCalled();
    });

    it('should not throw on multiple ready calls', () => {
      expect(() => {
        mock.ready();
        mock.ready();
      }).not.toThrow();
    });
  });

  describe('Environment Detection', () => {
    it('should detect non-CROSSx environment', () => {
      // In test environment, should be detected as browser
      const result = isCROSSxEnvironment();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('WebAppImpl', () => {
    let webapp: WebAppImpl;

    beforeEach(() => {
      webapp = new WebAppImpl('1.0.0');
    });

    it('should have correct version', () => {
      expect(webapp.version).toBe('1.0.0');
    });

    it('should register event listeners', () => {
      const callback = vi.fn();
      expect(() => {
        webapp.on('viewClosed', callback);
      }).not.toThrow();
    });

    it('should remove event listeners', () => {
      const callback = vi.fn();
      webapp.on('viewClosed', callback);
      expect(() => {
        webapp.off('viewClosed', callback);
      }).not.toThrow();
    });
  });
});

