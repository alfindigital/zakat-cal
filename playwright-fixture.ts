// Re-export Playwright's base fixture.
//
// Local sandbox runs (via the Lovable agent harness) inject any extra
// fixtures they need at runtime. In GitHub Actions CI we run against a
// standalone `@playwright/test` install with `playwright.ci.config.ts`,
// so re-exporting the base fixture keeps the same specs green in both
// environments without depending on private packages.
export { test, expect } from "@playwright/test";
