// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToolCard from '../../src/ui/components/ToolCard';

describe('Component: ToolCard', () => {
  beforeEach(() => {
    delete window.devpulse;
  });

  afterEach(() => {
    delete window.devpulse;
  });

  it('renders a loading skeleton when no data has arrived yet', () => {
    render(<ToolCard toolId="python" data={null} isUpdating={false} onUpdate={vi.fn()} />);
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('Loading status...')).toBeInTheDocument();
  });

  it('shows "Not Installed" status and a disabled button when the tool is missing', () => {
    render(
      <ToolCard
        toolId="python"
        data={{ installed: false, version: null, latestVersion: '3.12.0', canUpdate: true }}
        isUpdating={false}
        onUpdate={vi.fn()}
      />
    );
    expect(document.querySelector('.status-badge')).toHaveTextContent('Not Installed');
    expect(screen.getByRole('button', { name: /not installed/i })).toBeDisabled();
  });

  it('shows "Up to date" and disables the update button when versions match', () => {
    render(
      <ToolCard
        toolId="npm"
        data={{ installed: true, version: '10.9.2', latestVersion: '10.9.2', canUpdate: true }}
        isUpdating={false}
        onUpdate={vi.fn()}
      />
    );
    expect(screen.getByText('Up to date')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /up to date/i })).toBeDisabled();
  });

  it('enables the update button and calls onUpdate(toolId) when an update is available', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <ToolCard
        toolId="npm"
        data={{ installed: true, version: '10.0.0', latestVersion: '10.9.2', canUpdate: true }}
        isUpdating={false}
        onUpdate={onUpdate}
      />
    );

    expect(screen.getByText('Update Available')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /update tool/i });
    expect(button).toBeEnabled();

    await user.click(button);
    expect(onUpdate).toHaveBeenCalledWith('npm');
  });

  it('shows a spinning "Updating..." label and disables the button while an update runs', () => {
    render(
      <ToolCard
        toolId="npm"
        data={{ installed: true, version: '10.0.0', latestVersion: '10.9.2', canUpdate: true }}
        isUpdating={true}
        onUpdate={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
  });

  it('renders a copyable admin command box for manual+elevated tools and copies via window.devpulse', () => {
    window.devpulse = { copyToClipboard: vi.fn() };
    render(
      <ToolCard
        toolId="chocolatey"
        data={{
          installed: true,
          version: '2.2.2',
          latestVersion: null,
          canUpdate: false,
          adminCmd: 'choco upgrade all -y',
          manualUpdateUrl: 'https://chocolatey.org/'
        }}
        isUpdating={false}
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByText('choco upgrade all -y')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Copy Command'));
    expect(window.devpulse.copyToClipboard).toHaveBeenCalledWith('choco upgrade all -y');
  });

  it('opens the manual update URL via window.devpulse.openExternal when no admin command exists', () => {
    const openExternal = vi.fn().mockResolvedValue();
    window.devpulse = { openExternal };
    render(
      <ToolCard
        toolId="nodejs"
        data={{
          installed: true,
          version: '20.0.0',
          latestVersion: '21.0.0',
          canUpdate: false,
          manualUpdateUrl: 'https://nodejs.org/en/download/'
        }}
        isUpdating={false}
        onUpdate={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText(/official site/i));
    expect(openExternal).toHaveBeenCalledWith('https://nodejs.org/en/download/');
  });

  it('disables the button as a manual-update tool even when it is technically outdated', () => {
    render(
      <ToolCard
        toolId="java"
        data={{ installed: true, version: '17.0.0', latestVersion: '21.0.0', canUpdate: false }}
        isUpdating={false}
        onUpdate={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /manual update/i })).toBeDisabled();
  });
});
