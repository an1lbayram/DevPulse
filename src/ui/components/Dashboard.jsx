import { useState, useEffect, useMemo } from 'react';
import { Activity, RefreshCw, DownloadCloud, Search, ShieldCheck, Wrench, CheckCircle, ArrowUpCircle } from 'lucide-react';
import ToolCard from './ToolCard';
import LogPanel from './LogPanel';
import { TOOLS } from '../../config/tools';

import compareVersions from 'semver/functions/compare';
import valid from 'semver/functions/valid';
import coerce from 'semver/functions/coerce';

export default function Dashboard() {
  const [toolsData, setToolsData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);
  const [updatingTools, setUpdatingTools] = useState({});
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const addLog = (text, type = 'info') => {
    setLogs(prev => {
      const next = [...prev, { text, timestamp: new Date().toLocaleTimeString(), type }];
      const LIMIT = 1000;
      return next.length > LIMIT ? next.slice(next.length - LIMIT) : next;
    });
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    window.devpulse?.onScanProgress?.(msg => addLog(msg));
    window.devpulse?.onUpdateProgress?.(({ txt }) => addLog(txt));
    window.devpulse?.onLogMessage?.(msg => addLog(msg));

    return () => {
      window.devpulse?.removeAllListeners?.();
    };
  }, []);

  const handleScan = async () => {
    setIsScanning(true);
    addLog('Starting system scan...', 'info');
    try {
      const response = await window.devpulse.scanSystem();
      if (response && response.success) {
        setToolsData(response.data);
        addLog('Scan completed successfully.', 'success');
      } else {
        addLog(`Scan failed: ${response?.error || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      addLog(`Error triggering scan: ${err.message}`, 'error');
    }
    setIsScanning(false);
  };

  const handleUpdate = async (toolId, skipScan = false) => {
    setUpdatingTools(prev => ({ ...prev, [toolId]: true }));
    addLog(`Initiating update for ${toolId}...`, 'info');
    
    let isSuccess = false;
    try {
      const response = await window.devpulse.updateTool(toolId);
      if (response && response.success) {
        addLog(`Update for ${toolId} completed successfully.`, 'success');
        isSuccess = true;
        if (!skipScan) await handleScan();
      } else {
        addLog(`Update failed for ${toolId}: ${response?.error || 'Unknown error'}`, 'error');
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

  useEffect(() => {
    handleScan();
  }, []);

  const updatableCount = getUpdatableTools().length;

  const stats = useMemo(() => {
    if (!toolsData) return { total: TOOLS.length, installed: 0, updates: 0, upToDate: 0 };
    let installed = 0;
    let updates = 0;
    let upToDate = 0;

    Object.keys(toolsData).forEach(toolId => {
      const { installed: isInst, version, latestVersion } = toolsData[toolId];
      if (isInst) {
        installed++;
        const v1 = valid(coerce(version));
        const v2 = valid(coerce(latestVersion));
        if (v1 && v2 && compareVersions(v1, v2) >= 0) {
          upToDate++;
        } else if (v1 && v2 && compareVersions(v1, v2) < 0) {
          updates++;
        } else if (version && latestVersion && version === latestVersion) {
          upToDate++;
        } else if (version && latestVersion && version !== latestVersion) {
          updates++;
        }
      }
    });

    return { total: TOOLS.length, installed, updates, upToDate };
  }, [toolsData]);

  const filteredToolIds = useMemo(() => {
    const ids = toolsData ? Object.keys(toolsData) : TOOLS.map(t => t.id);
    return ids.filter(toolId => {
      const toolDef = TOOLS.find(t => t.id === toolId);
      const name = toolDef ? toolDef.name : toolId;
      const category = toolDef ? toolDef.category : '';

      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            toolId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [toolsData, searchQuery, selectedCategory]);

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="brand-section">
          <h1><Activity color="#6366f1" size={28} /> DevPulse</h1>
          <div className="author-tag">
            Created by{' '}
            <button 
              onClick={() => {
                const url = 'https://an1lbayram-github-io.vercel.app/';
                if (window.devpulse?.openExternal) {
                  window.devpulse.openExternal(url).catch(() => window.open(url, '_blank', 'noopener,noreferrer'));
                } else {
                  window.open(url, '_blank', 'noopener,noreferrer');
                }
              }}
              className="author-link"
            >
              &lt;/&gt; an1lbayram
            </button>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            className="action-btn primary" 
            onClick={handleUpdateAll}
            disabled={isScanning || isUpdatingAll || updatableCount === 0}
          >
            <DownloadCloud size={18} />
            {isUpdatingAll ? 'Updating All...' : `Update All (${updatableCount})`}
          </button>
          
          <button 
            className={`action-btn secondary ${isScanning ? 'scanning' : ''}`} 
            onClick={handleScan}
            disabled={isScanning || isUpdatingAll}
          >
            <RefreshCw size={18} className={isScanning ? 'spinning' : ''} />
            {isScanning ? 'Scanning...' : 'Scan System'}
          </button>
        </div>
      </header>

      {/* Summary Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
            <Wrench size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Tools</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <ShieldCheck size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.installed}</span>
            <span className="stat-label">Installed</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <ArrowUpCircle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.updates}</span>
            <span className="stat-label">Updates Available</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <CheckCircle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.upToDate}</span>
            <span className="stat-label">Up to Date</span>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="controls-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search tools..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="category-filters">
          <button 
            className={`filter-tab ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Tools
          </button>
          <button 
            className={`filter-tab ${selectedCategory === 'language' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('language')}
          >
            Languages
          </button>
          <button 
            className={`filter-tab ${selectedCategory === 'package_manager' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('package_manager')}
          >
            Package Managers
          </button>
        </div>
      </div>

      {/* Tools Cards Grid */}
      <div className="tools-grid">
        {toolsData ? (
          filteredToolIds.length > 0 ? (
            filteredToolIds.map(toolId => (
              <ToolCard 
                key={toolId} 
                toolId={toolId} 
                data={toolsData[toolId]} 
                isUpdating={updatingTools[toolId]}
                onUpdate={() => handleUpdate(toolId, false)}
              />
            ))
          ) : (
            <div className="empty-state">
              No matching tools found for "{searchQuery}".
            </div>
          )
        ) : (
          <div className="loading-state">
            <RefreshCw size={24} className="spinning" />
            <span>Scanning system environment...</span>
          </div>
        )}
      </div>

      <LogPanel logs={logs} onClearLogs={handleClearLogs} />
    </div>
  );
}
