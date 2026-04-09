import { useState, useEffect } from 'react';
import { Activity, RefreshCw, DownloadCloud } from 'lucide-react';
import ToolCard from './ToolCard';
import LogPanel from './LogPanel';

import compareVersions from 'semver/functions/compare';
import valid from 'semver/functions/valid';
import coerce from 'semver/functions/coerce';

export default function Dashboard() {
  const [toolsData, setToolsData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);
  const [updatingTools, setUpdatingTools] = useState({});
  const [logs, setLogs] = useState([]);

  const addLog = (text, type = 'info') => {
    setLogs(prev => {
      const next = [...prev, { text, type }];
      // Prevent unbounded growth
      const LIMIT = 1000;
      return next.length > LIMIT ? next.slice(next.length - LIMIT) : next;
    });
  };

  useEffect(() => {
    // Listen for IPC events
    window.devpulse.onScanProgress(msg => addLog(msg));
    window.devpulse.onUpdateProgress(({ txt }) => addLog(txt));
    window.devpulse.onLogMessage(msg => addLog(msg));

    return () => {
      window.devpulse.removeAllListeners();
    };
  }, []);

  const handleScan = async () => {
    setIsScanning(true);
    addLog('Starting system scan...', 'info');
    try {
      const response = await window.devpulse.scanSystem();
      if (response.success) {
        setToolsData(response.data);
        addLog('Scan completed successfully.', 'success');
      } else {
        addLog(`Scan failed: ${response.error}`, 'error');
      }
    } catch (err) {
      addLog(`Error trigger scan: ${err.message}`, 'error');
    }
    setIsScanning(false);
  };

  const handleUpdate = async (toolId, skipScan = false) => {
    setUpdatingTools(prev => ({ ...prev, [toolId]: true }));
    addLog(`Initiating update for ${toolId}...`, 'info');
    
    let isSuccess = false;
    try {
      const response = await window.devpulse.updateTool(toolId);
      if (response.success) {
        addLog(`Update for ${toolId} completed.`, 'success');
        isSuccess = true;
        // Sadece tekil güncellemelerde tarama yap, toplu ise en sonda yapılacak
        if (!skipScan) await handleScan();
      } else {
        addLog(`Update failed for ${toolId}: ${response.error}`, 'error');
      }
    } catch (err) {
      addLog(`Error during update: ${err.message}`, 'error');
    }
    
    setUpdatingTools(prev => ({ ...prev, [toolId]: false }));
    return isSuccess;
  };

  const getUpdatableTools = () => {
    if (!toolsData) return [];
    const updatable = [];
    Object.keys(toolsData).forEach(toolId => {
      const { installed, version, latestVersion, canUpdate } = toolsData[toolId];
      if (installed && version && latestVersion && canUpdate) {
        const v1 = valid(coerce(version));
        const v2 = valid(coerce(latestVersion));
        if (v1 && v2 && compareVersions(v1, v2) < 0) {
            updatable.push(toolId);
        } else if (!v1 || !v2) {
            // Eğer parse edilemeyen bir versiyonsa metin kıyaslaması yap
            if (version !== latestVersion) updatable.push(toolId);
        }
      }
    });
    return updatable;
  };

  const handleUpdateAll = async () => {
    const toolsToUpdate = getUpdatableTools();
    if (toolsToUpdate.length === 0) {
      addLog('No tools require updating.', 'info');
      return;
    }

    setIsUpdatingAll(true);
    addLog(`Starting bulk update for ${toolsToUpdate.length} tools...`, 'info');
    
    for (const toolId of toolsToUpdate) {
      await handleUpdate(toolId, true);
    }
    
    addLog('Bulk update process completed. Running final system scan...', 'success');
    await handleScan();
    setIsUpdatingAll(false);
  };

  // Initial scan on mount
  useEffect(() => {
    handleScan();
  }, []);

  const updatableCount = getUpdatableTools().length;

  return (
    <div className="dashboard-container">
      <div className="header">
        <h1><Activity color="#6366f1" /> DevPulse</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className={`scan-btn ${isUpdatingAll ? 'outline' : ''}`} 
            onClick={handleUpdateAll}
            disabled={isScanning || isUpdatingAll || updatableCount === 0}
            style={{ 
              backgroundColor: updatableCount > 0 && !isUpdatingAll ? 'var(--accent-success)' : undefined
            }}
          >
            <DownloadCloud size={18} />
            {isUpdatingAll ? 'Updating All...' : `Update All (${updatableCount})`}
          </button>
          
          <button 
            className={`scan-btn ${isScanning ? 'scanning' : ''}`} 
            onClick={handleScan}
            disabled={isScanning || isUpdatingAll}
          >
            <RefreshCw size={18} className={isScanning ? 'scanning' : ''} />
            {isScanning ? 'Scanning...' : 'Scan System'}
          </button>
        </div>
      </div>

      <div className="tools-grid">
        {toolsData ? (
          Object.keys(toolsData).map(toolId => (
            <ToolCard 
              key={toolId} 
              toolId={toolId} 
              data={toolsData[toolId]} 
              isUpdating={updatingTools[toolId]}
              onUpdate={() => handleUpdate(toolId, false)}
            />
          ))
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-secondary)' }}>
            Loading tool registry...
          </div>
        )}
      </div>

      <LogPanel logs={logs} />
    </div>
  );
}
