/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'
import type { AxeMatchers } from 'jest-axe'

declare module 'vitest' {
  interface Assertion<T = any> extends TestingLibraryMatchers<typeof expect.stringContaining, T>, AxeMatchers {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<typeof expect.stringContaining, any> {}
}
