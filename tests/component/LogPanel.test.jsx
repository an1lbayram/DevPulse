// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LogPanel from '../../src/ui/components/LogPanel';

const sampleLogs = [
  { text: 'Starting scan', timestamp: '10:00:00', type: 'info' },
  { text: 'Update succeeded', timestamp: '10:00:05', type: 'success' },
  { text: 'Something failed', timestamp: '10:00:10', type: 'error' }
];

describe('Component: LogPanel', () => {
  beforeEach(() => {
    delete window.devpulse;
    Object.assign(navigator, { clipboard: { writeText: vi.fn() } });
  });

  afterEach(() => {
    delete window.devpulse;
  });

  it('shows an empty state placeholder when there are no logs', () => {
    render(<LogPanel logs={[]} onClearLogs={vi.fn()} />);
    expect(screen.getByText(/waiting for operations/i)).toBeInTheDocument();
    expect(screen.getByText('0 entries')).toBeInTheDocument();
  });

  it('renders every log entry with its timestamp and text', () => {
    render(<LogPanel logs={sampleLogs} onClearLogs={vi.fn()} />);
    expect(screen.getByText('3 entries')).toBeInTheDocument();
    expect(screen.getByText('Starting scan')).toBeInTheDocument();
    expect(screen.getByText('Update succeeded')).toBeInTheDocument();
    expect(screen.getByText('Something failed')).toBeInTheDocument();
  });

  it('filters logs by type when a filter tab is clicked', () => {
    render(<LogPanel logs={sampleLogs} onClearLogs={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Error' }));

    expect(screen.getByText('Something failed')).toBeInTheDocument();
    expect(screen.queryByText('Starting scan')).not.toBeInTheDocument();
    expect(screen.queryByText('Update succeeded')).not.toBeInTheDocument();
  });

  it('calls onClearLogs when the Clear button is clicked', () => {
    const onClearLogs = vi.fn();
    render(<LogPanel logs={sampleLogs} onClearLogs={onClearLogs} />);

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(onClearLogs).toHaveBeenCalledTimes(1);
  });

  it('omits the Clear button entirely when onClearLogs is not provided', () => {
    render(<LogPanel logs={sampleLogs} />);
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });

  it('copies the currently filtered logs via window.devpulse when available', () => {
    const copyToClipboard = vi.fn();
    window.devpulse = { copyToClipboard };
    render(<LogPanel logs={sampleLogs} onClearLogs={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /copy/i }));

    expect(copyToClipboard).toHaveBeenCalledTimes(1);
    const copiedText = copyToClipboard.mock.calls[0][0];
    expect(copiedText).toContain('Starting scan');
    expect(copiedText).toContain('Something failed');
  });

  it('falls back to navigator.clipboard.writeText when window.devpulse is unavailable', () => {
    render(<LogPanel logs={sampleLogs} onClearLogs={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /copy/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
  });
});
