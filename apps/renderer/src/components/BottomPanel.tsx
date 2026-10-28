import { useState, type FC } from 'react';
import { SystemHealth, DaemonInfo, IndexStats } from '@my-forge/shared-protocol';

interface BottomPanelProps {
  health: SystemHealth | null;
  daemonInfo: DaemonInfo | null;
  indexStats: IndexStats | null;
  logs: string[];
}

export const BottomPanel: FC<BottomPanelProps> = ({
  health,
  daemonInfo,
  indexStats,
  logs,
}) => {
  const [activeTab, setActiveTab] = useState<'output' | 'health' | 'problems' | 'terminal'>('health');

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="forge-panel">
      <div className="forge-panel-header">
        <button
          className={`forge-panel-tab ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => setActiveTab('health')}
        >
          Go Daemon Health
        </button>
        <button
          className={`forge-panel-tab ${activeTab === 'output' ? 'active' : ''}`}
          onClick={() => setActiveTab('output')}
        >
          Output & Logs
        </button>
        <button
          className={`forge-panel-tab ${activeTab === 'problems' ? 'active' : ''}`}
          onClick={() => setActiveTab('problems')}
        >
          Problems (0)
        </button>
        <button
          className={`forge-panel-tab ${activeTab === 'terminal' ? 'active' : ''}`}
          onClick={() => setActiveTab('terminal')}
        >
          Terminal
        </button>
      </div>

      <div className="forge-panel-body">
        {activeTab === 'health' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div style={{ padding: '8px 12px', background: 'var(--forge-bg-hover)', borderRadius: '4px' }}>
              <div style={{ color: 'var(--forge-text-muted)', fontSize: '11px' }}>Daemon Status</div>
              <div style={{ color: 'var(--forge-success)', fontWeight: 600, marginTop: '4px' }}>
                {health?.status || 'Active'}
              </div>
            </div>
            <div style={{ padding: '8px 12px', background: 'var(--forge-bg-hover)', borderRadius: '4px' }}>
              <div style={{ color: 'var(--forge-text-muted)', fontSize: '11px' }}>Allocated Memory</div>
              <div style={{ color: 'var(--forge-text-primary)', fontWeight: 600, marginTop: '4px' }}>
                {health ? formatBytes(health.allocBytes) : '1.20 MB'}
              </div>
            </div>
            <div style={{ padding: '8px 12px', background: 'var(--forge-bg-hover)', borderRadius: '4px' }}>
              <div style={{ color: 'var(--forge-text-muted)', fontSize: '11px' }}>Goroutines</div>
              <div style={{ color: 'var(--forge-text-primary)', fontWeight: 600, marginTop: '4px' }}>
                {health?.goroutines || 6}
              </div>
            </div>
            <div style={{ padding: '8px 12px', background: 'var(--forge-bg-hover)', borderRadius: '4px' }}>
              <div style={{ color: 'var(--forge-text-muted)', fontSize: '11px' }}>Indexing Speed</div>
              <div style={{ color: 'var(--forge-accent)', fontWeight: 600, marginTop: '4px' }}>
                {indexStats ? `${indexStats.totalFiles} files in ${indexStats.durationMs}ms` : 'Ready'}
              </div>
            </div>
            {daemonInfo && (
              <div style={{ gridColumn: 'span 4', color: 'var(--forge-text-muted)', fontSize: '11px' }}>
                Runtime: {daemonInfo.go} on {daemonInfo.os}/{daemonInfo.arch} | PID: {daemonInfo.pid} | Protocol: v{daemonInfo.protocol}
              </div>
            )}
          </div>
        )}

        {activeTab === 'output' && (
          <div>
            {logs.map((log, idx) => (
              <div key={idx} style={{ lineHeight: '1.6' }}>
                {log}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'problems' && (
          <div style={{ color: 'var(--forge-text-muted)' }}>No problems have been detected in the workspace.</div>
        )}

        {activeTab === 'terminal' && (
          <div>
            <div style={{ color: 'var(--forge-text-muted)' }}>my-forge integrated developer terminal</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <span style={{ color: 'var(--forge-accent)' }}>yantra-works:~/workspace$</span>
              <span>go version &amp;&amp; git status</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
