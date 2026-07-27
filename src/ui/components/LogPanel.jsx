import { useRef, useEffect, useState } from 'react';
import { Terminal, Copy, Trash2, Check } from 'lucide-react';

export default function LogPanel({ logs = [], onClearLogs }) {
  const logEndRef = useRef(null);
  const [filterType, setFilterType] = useState('all');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleCopy = () => {
    const text = filteredLogs.map(l => `[${l.timestamp || ''}] [${l.type.toUpperCase()}] ${l.text}`).join('\n');
    if (window.devpulse?.copyToClipboard) {
      window.devpulse.copyToClipboard(text);
    } else {
      navigator.clipboard.writeText(text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter(l => filterType === 'all' || l.type === filterType);

  return (
    <div className="log-panel">
      <div className="log-header">
        <div className="log-header-title">
          <Terminal size={16} color="#6366f1" />
          <span>Console Output</span>
          <span className="log-badge">{logs.length} entries</span>
        </div>

        <div className="log-filters">
          <button 
            className={`log-filter-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All
          </button>
          <button 
            className={`log-filter-btn ${filterType === 'info' ? 'active' : ''}`}
            onClick={() => setFilterType('info')}
          >
            Info
          </button>
          <button 
            className={`log-filter-btn ${filterType === 'success' ? 'active' : ''}`}
            onClick={() => setFilterType('success')}
          >
            Success
          </button>
          <button 
            className={`log-filter-btn ${filterType === 'error' ? 'active' : ''}`}
            onClick={() => setFilterType('error')}
          >
            Error
          </button>
        </div>

        <div className="log-actions">
          <button className="log-action-btn" onClick={handleCopy} title="Copy Logs">
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          {onClearLogs && (
            <button className="log-action-btn danger" onClick={onClearLogs} title="Clear Logs">
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      <div className="log-content">
        {filteredLogs.length === 0 ? (
          <div className="log-empty">
            <span>Ready. Waiting for operations...</span>
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div key={index} className={`log-entry ${log.type}`}>
              {log.timestamp && <span className="log-timestamp">[{log.timestamp}]</span>}
              <span className="log-text">{log.text}</span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
