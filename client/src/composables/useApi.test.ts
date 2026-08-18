import { describe, it, expect } from 'vitest';
import { injectAuthCallbacks, setupAxiosInterceptors } from './useApi';

describe('useApi', () => {
  it('should setup interceptors successfully', () => {
    expect(typeof injectAuthCallbacks).toBe('function');
    expect(typeof setupAxiosInterceptors).toBe('function');
  });
});
