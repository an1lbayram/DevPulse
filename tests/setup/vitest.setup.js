import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// jsdom does not implement scrollIntoView; LogPanel calls it on every log update.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// vitest.config.mjs does not set `test.globals: true`, so @testing-library/react
// never gets an implicit afterEach hook to unmount components between tests.
// Without this, every component test in a jsdom file accumulates DOM from
// previous tests, producing false "multiple elements found" failures.
if (typeof document !== 'undefined') {
  afterEach(async () => {
    const { cleanup } = await import('@testing-library/react');
    cleanup();
  });
}
