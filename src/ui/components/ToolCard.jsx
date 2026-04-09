import { useState } from 'react';
import { RefreshCw, Download, ExternalLink, AlertCircle, Terminal, Copy, Check } from 'lucide-react';

import compareVersions from 'semver/functions/compare';
import valid from 'semver/functions/valid';
import coerce from 'semver/functions/coerce';

export default function ToolCard({ toolId, data, isUpdating, onUpdate }) {
  const { name, icon } = getToolMeta(toolId);
  const [showTooltip, setShowTooltip] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!data) {
    return (
      <div className="tool-card">
        <div className="card-header">
          <div className="tool-title">
             <span className="tool-icon">{icon}</span>
             <span className="tool-name">{name}</span>
          </div>
        </div>
        <div className="version-info" style={{ alignItems: 'center', justifyContent: 'center' }}>
          Loading...
        </div>
      </div>
    );
  }

  const { installed, version, latestVersion, canUpdate, manualUpdateUrl, adminCmd } = data;

  let status = 'not_installed';
  let isUpToDate = false;

  if (installed) {
    status = 'installed';
    const v1 = valid(coerce(version));
    const v2 = valid(coerce(latestVersion));

    if (v1 && v2) {
      if (compareVersions(v1, v2) >= 0) {
        status = 'up_to_date';
        isUpToDate = true;
      } else {
        status = 'update_available';
      }
    } else if (!latestVersion) {
      // latestVersion bilinmiyor (örn. chocolatey)
      status = 'installed';
    } else if (version === latestVersion) {
      status = 'up_to_date';
      isUpToDate = true;
    } else {
      status = 'update_available';
    }
  }

  const badgeMap = {
    not_installed:    { cls: 'status-not-installed',   text: 'Not Installed' },
    up_to_date:       { cls: 'status-up-to-date',      text: 'Up to date' },
    update_available: { cls: 'status-update-available', text: 'Update Available' },
    installed:        { cls: 'status-installed',        text: 'Installed' }
  };
  const { cls: badgeClass, text: badgeText } = badgeMap[status] || badgeMap.not_installed;

  // Buton durumu
  const isManual = installed && !canUpdate;
  const isDisabled = !installed || isUpToDate || isUpdating || isManual;

  let btnClass = 'update-btn';
  let btnLabel = 'Update Tool';

  if (!installed)       { btnClass += ' btn-disabled'; btnLabel = 'Not Installed'; }
  else if (isUpToDate)  { btnClass += ' btn-disabled'; btnLabel = 'Up to date ✓'; }
  else if (isManual)    { btnClass += ' btn-disabled'; btnLabel = 'Manual Update'; }
  if (isUpdating)       { btnLabel = 'Updating...'; }

  // Tooltip metni
  const tooltipText = !installed
    ? 'Bu araç sisteminizde kurulu değil.'
    : isUpToDate
    ? 'Araç zaten en güncel sürümde.'
    : isManual
    ? adminCmd
      ? 'Yönetici (Admin) yetkisi gerekiyor. Komutu kopyalayın ve yönetici olarak çalıştırın.'
      : 'Bu araç sadece manuel olarak güncellenebilir.'
    : '';

  const handleCopy = () => {
    if (window.devpulse?.copyToClipboard) {
      window.devpulse.copyToClipboard(adminCmd);
    } else {
      navigator.clipboard.writeText(adminCmd);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenUrl = () => {
    const url = (manualUpdateUrl || '').trim();
    if (!url) return;
    if (window.devpulse?.openExternal) {
      window.devpulse.openExternal(url).catch(() => {
        window.open(url, '_blank', 'noopener,noreferrer');
      });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="tool-card">
      <div className="card-header">
        <div className="tool-title">
           <span className="tool-icon">{icon}</span>
           <span className="tool-name">{name}</span>
        </div>
        <span className={`status-badge ${badgeClass}`}>{badgeText}</span>
      </div>

      <div className="version-info">
        <div className="version-row">
          <span>Current:</span>
          <span className="version-value">{installed ? version : 'N/A'}</span>
        </div>
        <div className="version-row">
          <span>Latest:</span>
          <span className="version-value">{latestVersion || 'Unknown'}</span>
        </div>
      </div>

      {/* Admin komutu kopyalama kutusu (Chocolatey gibi araçlar için) */}
      {isManual && installed && adminCmd && (
        <div className="admin-cmd-info">
          <div className="admin-cmd-header">
            <Terminal size={13} />
            <span>Yönetici olarak çalıştırın:</span>
          </div>
          <div className="admin-cmd-row">
            <code className="admin-cmd-code">{adminCmd}</code>
            <button className="copy-btn" onClick={handleCopy} title="Komutu Kopyala">
              {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
            </button>
          </div>
        </div>
      )}

      {/* Sadece indirme linki olan araçlar için */}
      {isManual && installed && !adminCmd && manualUpdateUrl && (
        <div className="manual-update-info">
          <AlertCircle size={14} />
          <span>
            Bu araç otomatik güncellenemiyor.{' '}
            <span className="manual-update-link" onClick={handleOpenUrl}>
              Resmi siteye git <ExternalLink size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </span>
          </span>
        </div>
      )}

      <div className="card-actions">
        <div
          className="btn-wrapper"
          onMouseEnter={() => isDisabled && setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          style={{ position: 'relative' }}
        >
          <button
            className={btnClass}
            disabled={isDisabled}
            onClick={() => !isDisabled ? onUpdate(toolId) : null}
          >
            {isUpdating ? <RefreshCw className="spinning" size={16} /> : <Download size={16} />}
            {btnLabel}
          </button>

          {showTooltip && isDisabled && tooltipText && (
            <div className="btn-tooltip">{tooltipText}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function getToolMeta(id) {
  const map = {
    python:     { name: 'Python',      icon: '🐍' },
    nodejs:     { name: 'Node.js',     icon: '🟢' },
    java:       { name: 'Java (JDK)',  icon: '☕' },
    cpp:        { name: 'C++ (g++)',   icon: '⚙️' },
    dotnet:     { name: '.NET SDK',    icon: '🟣' },
    npm:        { name: 'npm',         icon: '📦' },
    yarn:       { name: 'yarn',        icon: '🧶' },
    pip:        { name: 'pip',         icon: '🔧' },
    pipx:       { name: 'pipx',        icon: '🧰' },
    chocolatey: { name: 'Chocolatey', icon: '🍫' },
    winget:     { name: 'winget',      icon: '🪟' }
  };
  return map[id] || { name: id, icon: '🔧' };
}
