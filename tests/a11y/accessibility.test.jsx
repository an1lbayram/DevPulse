// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ToolCard from '../../src/ui/components/ToolCard';
import LogPanel from '../../src/ui/components/LogPanel';
import Dashboard from '../../src/ui/components/Dashboard';
import { TOOLS } from '../../src/config/tools';

expect.extend(toHaveNoViolations);

describe('Accessibility: ToolCard', () => {
  it('has no detectable a11y violations in the loading state', async () => {
    const { container } = render(<ToolCard toolId="python" data={null} isUpdating={false} onUpdate={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no detectable a11y violations when installed and up to date', async () => {
    const { container } = render(
      <ToolCard
        toolId="npm"
        data={{ installed: true, version: '10.9.2', latestVersion: '10.9.2', canUpdate: true }}
        isUpdating={false}
        onUpdate={vi.fn()}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no detectable a11y violations when an update is available', async () => {
    const { container } = render(
      <ToolCard
        toolId="npm"
        data={{ installed: true, version: '10.0.0', latestVersion: '10.9.2', canUpdate: true }}
        isUpdating={false}
        onUpdate={vi.fn()}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no detectable a11y violations for the manual-update admin-command layout', async () => {
    const { container } = render(
      <ToolCard
        toolId="chocolatey"
        data={{
          installed: true,
          version: '2.2.2',
          latestVersion: null,
          canUpdate: false,
          adminCmd: 'choco upgrade all -y'
        }}
        isUpdating={false}
        onUpdate={vi.fn()}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('Accessibility: LogPanel', () => {
  it('has no detectable a11y violations when empty', async () => {
    const { container } = render(<LogPanel logs={[]} onClearLogs={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no detectable a11y violations with mixed log entries', async () => {
    const { container } = render(
      <LogPanel
        logs={[
          { text: 'Scan started', timestamp: '10:00:00', type: 'info' },
          { text: 'Update finished', timestamp: '10:00:05', type: 'success' },
          { text: 'Something failed', timestamp: '10:00:10', type: 'error' }
        ]}
        onClearLogs={vi.fn()}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('Accessibility: Dashboard (full page)', () => {
  beforeEach(() => {
    const data = {};
    TOOLS.forEach(tool => {
      data[tool.id] = {
        installed: true,
        version: '1.0.0',
        latestVersion: '1.0.0',
        canUpdate: !!tool.update,
        manualUpdateUrl: tool.manualUpdateUrl || null,
        adminCmd: tool.adminCmd || null
      };
    });
    window.devpulse = {
      scanSystem: vi.fn().mockResolvedValue({ success: true, data }),
      updateTool: vi.fn(),
      onScanProgress: vi.fn(),
      onUpdateProgress: vi.fn(),
      onLogMessage: vi.fn(),
      removeAllListeners: vi.fn()
    };
  });

  afterEach(() => {
    delete window.devpulse;
  });

  it('has no detectable a11y violations once the dashboard has finished its initial scan', async () => {
    const { container } = render(<Dashboard />);
    await waitFor(() => expect(screen.queryByText(/scanning system environment/i)).not.toBeInTheDocument());

    expect(await axe(container)).toHaveNoViolations();
  });
});
