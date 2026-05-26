import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Automatically cleanup after each test to keep them isolated
afterEach(() => {
  cleanup();
});
