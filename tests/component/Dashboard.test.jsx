// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../../src/ui/components/Dashboard';
import { TOOLS } from '../../src/config/tools';

function buildToolsData(overrides = {}) {
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
  return { ...data, ...overrides };
}

function installDevpulseMock({ scanResult } = {}) {
  const api = {
    scanSystem: vi.fn().mockResolvedValue(scanResult ?? { success: true, data: buildToolsData() }),
    getToolStatus: vi.fn(),
    updateTool: vi.fn().mockResolvedValue({ success: true }),
    updateAll: vi.fn(),
    onScanProgress: vi.fn(),
    onUpdateProgress: vi.fn(),
    onLogMessage: vi.fn(),
    removeAllListeners: vi.fn(),
    getSettings: vi.fn(),
    saveSettings: vi.fn(),
    openExternal: vi.fn().mockResolvedValue(),
    copyToClipboard: vi.fn()
  };
  window.devpulse = api;
  return api;
}

describe('Component: Dashboard', () => {
  beforeEach(() => {
    delete window.devpulse;
  });

  afterEach(() => {
    delete window.devpulse;
  });

  it('scans automatically on mount and renders a card per tool once data arrives', async () => {
    const api = installDevpulseMock();
    render(<Dashboard />);

    expect(screen.getByText(/scanning system environment/i)).toBeInTheDocument();
    await waitFor(() => expect(api.scanSystem).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByText(/scanning system environment/i)).not.toBeInTheDocument());

    expect(screen.getAllByText('Up to date').length).toBe(TOOLS.length);
  });

  it('shows an error log entry when the scan response reports failure', async () => {
    installDevpulseMock({ scanResult: { success: false, error: 'winget not found' } });
    render(<Dashboard />);

    await waitFor(() => expect(screen.getByText(/scan failed: winget not found/i)).toBeInTheDocument());
  });

  it('computes summary stats (installed / up to date / updates available)', async () => {
    installDevpulseMock({
      scanResult: {
        success: true,
        data: buildToolsData({
          npm: { installed: true, version: '10.0.0', latestVersion: '10.9.2', canUpdate: true },
          nodejs: { installed: false, version: null, latestVersion: '21.0.0', canUpdate: false }
        })
      }
    });
    render(<Dashboard />);

    await waitFor(() => expect(screen.queryByText(/scanning system environment/i)).not.toBeInTheDocument());

    expect(screen.getByText(String(TOOLS.length))).toBeInTheDocument(); // Total Tools
    expect(screen.getByText(String(TOOLS.length - 1))).toBeInTheDocument(); // Installed (all but nodejs)
  });

  it('filters visible tool cards by the search box', async () => {
    installDevpulseMock();
    const user = userEvent.setup();
    render(<Dashboard />);

    await waitFor(() => expect(screen.queryByText(/scanning system environment/i)).not.toBeInTheDocument());

    await user.type(screen.getByPlaceholderText(/search tools/i), 'Python');

    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.queryByText('Node.js')).not.toBeInTheDocument();
  });

  it('shows an empty state when the search query matches nothing', async () => {
    installDevpulseMock();
    const user = userEvent.setup();
    render(<Dashboard />);

    await waitFor(() => expect(screen.queryByText(/scanning system environment/i)).not.toBeInTheDocument());
    await user.type(screen.getByPlaceholderText(/search tools/i), 'no-such-tool-xyz');

    expect(screen.getByText(/no matching tools found/i)).toBeInTheDocument();
  });

  it('filters by category when a category tab is clicked', async () => {
    installDevpulseMock();
    const user = userEvent.setup();
    render(<Dashboard />);

    await waitFor(() => expect(screen.queryByText(/scanning system environment/i)).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /package managers/i }));

    expect(screen.getByText('npm')).toBeInTheDocument();
    expect(screen.queryByText('Python')).not.toBeInTheDocument();
  });

  it('disables "Update All" when nothing needs updating, enables it when something does', async () => {
    installDevpulseMock({
      scanResult: {
        success: true,
        data: buildToolsData({
          npm: { installed: true, version: '10.0.0', latestVersion: '10.9.2', canUpdate: true }
        })
      }
    });
    render(<Dashboard />);

    await waitFor(() => expect(screen.queryByText(/scanning system environment/i)).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: /update all \(1\)/i })).toBeEnabled();
  });

  it('re-triggers a scan when "Scan System" is clicked', async () => {
    const api = installDevpulseMock();
    const user = userEvent.setup();
    render(<Dashboard />);

    await waitFor(() => expect(api.scanSystem).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('button', { name: /scan system/i }));

    await waitFor(() => expect(api.scanSystem).toHaveBeenCalledTimes(2));
  });

  it('removes IPC listeners on unmount', async () => {
    const api = installDevpulseMock();
    const { unmount } = render(<Dashboard />);
    await waitFor(() => expect(api.scanSystem).toHaveBeenCalledTimes(1));

    unmount();
    expect(api.removeAllListeners).toHaveBeenCalledTimes(1);
  });
});
