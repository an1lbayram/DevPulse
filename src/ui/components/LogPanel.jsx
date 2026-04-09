import { useRef, useEffect } from 'react';
import { Terminal, Copy } from 'lucide-react';

export default function LogPanel({ logs }) {
  const logEndRef = useRef(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleCopy = () => {
    const text = logs.map(l => l.text).join('\n');
    if (window.devpulse?.copyToClipboard) {
      window.devpulse.copyToClipboard(text);
      return;
    }
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="log-panel">
      <div className="log-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Terminal size={16} />
          <span>Output Logs</span>
        </div>
        <button className="update-btn outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={handleCopy}>
          <Copy size={14} /> Copy
        </button>
      </div>
      <div className="log-content">
        {logs.length === 0 ? (
          <span style={{ color: '#64748b' }}>Ready. Waiting for operations...</span>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`log-entry ${log.type}`}>
              {log.text}
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
