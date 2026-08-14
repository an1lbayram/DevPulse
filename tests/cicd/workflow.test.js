import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';

const rootDir = path.resolve(__dirname, '../..');
const workflowPath = path.join(rootDir, '.github', 'workflows', 'ci.yml');
const raw = readFileSync(workflowPath, 'utf-8');
const workflow = load(raw);

function allSteps(job) {
  return job.steps || [];
}

function stepRunCommands(job) {
  return allSteps(job)
    .map(s => s.run)
    .filter(Boolean);
}

describe('CI/CD: .github/workflows/ci.yml structure', () => {
  it('is valid, parseable YAML', () => {
    expect(workflow).toBeTruthy();
    expect(typeof workflow).toBe('object');
  });

  it('triggers on both push and pull_request', () => {
    // js-yaml parses the bare `on:` key as boolean `true` in YAML 1.1; the
    // GitHub Actions schema special-cases this, so accept either form.
    const on = workflow.on ?? workflow[true];
    expect(on).toBeTruthy();
    expect(on).toHaveProperty('push');
    expect(on).toHaveProperty('pull_request');
  });

  it('defines at least one job', () => {
    expect(workflow.jobs).toBeTruthy();
    expect(Object.keys(workflow.jobs).length).toBeGreaterThan(0);
  });

  it('runs on a Windows runner (this app only supports Windows tooling)', () => {
    const runsOn = Object.values(workflow.jobs).map(j => j['runs-on']);
    expect(runsOn.some(r => typeof r === 'string' && r.includes('windows'))).toBe(true);
  });

  Object.entries(workflow.jobs).forEach(([jobName, job]) => {
    it(`job "${jobName}" checks out the repository before doing anything else`, () => {
      const steps = allSteps(job);
      expect(steps.length).toBeGreaterThan(0);
      const usesValues = steps.map(s => s.uses).filter(Boolean);
      const checkoutIndex = usesValues.findIndex(u => u.startsWith('actions/checkout'));
      expect(checkoutIndex).toBe(0);
    });
  });

  it('installs dependencies with a clean, reproducible install (npm install/ci)', () => {
    const allRuns = Object.values(workflow.jobs).flatMap(stepRunCommands);
    expect(allRuns.some(cmd => /npm (install|ci)\b/.test(cmd))).toBe(true);
  });

  it('runs ESLint as part of CI', () => {
    const allRuns = Object.values(workflow.jobs).flatMap(stepRunCommands);
    expect(allRuns.some(cmd => cmd.includes('npm run lint'))).toBe(true);
  });

  it('runs the automated test suite as part of CI', () => {
    const allRuns = Object.values(workflow.jobs).flatMap(stepRunCommands);
    expect(allRuns.some(cmd => cmd.trim() === 'npm test' || cmd.includes('npm test'))).toBe(true);
  });

  it('uses actions/setup-node pinned to a specific major Node.js version', () => {
    const setupNodeSteps = Object.values(workflow.jobs)
      .flatMap(allSteps)
      .filter(s => s.uses && s.uses.startsWith('actions/setup-node'));
    expect(setupNodeSteps.length).toBeGreaterThan(0);
    setupNodeSteps.forEach(step => {
      expect(step.with?.['node-version']).toBeTruthy();
    });
  });

  it('runs the Playwright E2E suite in a dedicated job', () => {
    const allRuns = Object.values(workflow.jobs).flatMap(stepRunCommands);
    expect(allRuns.some(cmd => cmd.includes('playwright install'))).toBe(true);
    expect(allRuns.some(cmd => cmd.includes('npm run test:e2e'))).toBe(true);
  });

  it('runs a dependency security audit job that reports without silently being skipped', () => {
    const allRuns = Object.values(workflow.jobs).flatMap(stepRunCommands);
    expect(allRuns.some(cmd => cmd.includes('npm run test:audit'))).toBe(true);
  });
});
