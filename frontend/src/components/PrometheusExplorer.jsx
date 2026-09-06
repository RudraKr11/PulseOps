import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Cpu, Server, Zap, Copy, Check, Search, Terminal, ArrowUpRight } from 'lucide-react';

export default function PrometheusExplorer({ health }) {
  const [metricsText, setMetricsText] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedQuery, setCopiedQuery] = useState(null);
  const [parsedMetrics, setParsedMetrics] = useState([]);
  const [summaryStats, setSummaryStats] = useState({ totalRequests: 0, memoryMb: 0, uptimeSeconds: 0 });

  const fetchPrometheusMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/metrics');
      if (res.ok) {
        const text = await res.text();
        setMetricsText(text);
        parseMetricsText(text);
      }
    } catch (err) {
      console.error('Failed to fetch Prometheus metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseMetricsText = (rawText) => {
    const lines = rawText.split('\n');
    const metricGroups = [];
    let currentMetric = null;
    let totalReq = 0;
    let memoryBytes = 0;
    let uptimeSec = 0;

    lines.forEach((line) => {
      if (line.startsWith('# HELP')) {
        const parts = line.split(' ');
        const name = parts[2];
        const help = parts.slice(3).join(' ');
        currentMetric = { name, help, type: 'COUNTER', samples: [] };
        metricGroups.push(currentMetric);
      } else if (line.startsWith('# TYPE')) {
        const parts = line.split(' ');
        if (currentMetric && parts[2] === currentMetric.name) {
          currentMetric.type = parts[3].toUpperCase();
        }
      } else if (line.trim() !== '' && !line.startsWith('#')) {
        const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)\s*(\{([^}]+)\})?\s+(.+)$/);
        if (match) {
          const [, name, , labelStr, valueStr] = match;
          const value = parseFloat(valueStr);

          // Track summary metrics
          if (name === 'http_requests_total' && !isNaN(value)) {
            totalReq += value;
          }
          if (name === 'process_resident_memory_bytes' && !isNaN(value)) {
            memoryBytes = value;
          }
          if (name === 'process_uptime_seconds' && !isNaN(value)) {
            uptimeSec = value;
          }

          // Parse labels
          const labels = {};
          if (labelStr) {
            labelStr.split(',').forEach((pair) => {
              const [k, v] = pair.split('=');
              if (k && v) {
                labels[k.trim()] = v.replace(/"/g, '').trim();
              }
            });
          }

          // Attach sample to group or create default
          let targetGroup = metricGroups.find((g) => g.name === name);
          if (!targetGroup) {
            targetGroup = { name, help: 'Prometheus Runtime Metric', type: 'GAUGE', samples: [] };
            metricGroups.push(targetGroup);
          }
          targetGroup.samples.push({ name, labels, value });
        }
      }
    });

    setParsedMetrics(metricGroups);
    setSummaryStats({
      totalRequests: totalReq,
      memoryMb: (memoryBytes / (1024 * 1024)).toFixed(1),
      uptimeSeconds: Math.round(uptimeSec)
    });
  };

  useEffect(() => {
    fetchPrometheusMetrics();
    const interval = setInterval(fetchPrometheusMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(id);
    setTimeout(() => setCopiedQuery(null), 2000);
  };

  const filteredMetrics = parsedMetrics.filter(
    (g) =>
      g.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      g.help.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.12), rgba(99, 102, 241, 0.12))',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '20px',
          padding: '1.5rem',
          marginBottom: '2rem',
          backdropFilter: 'blur(16px)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #f43f5e, #e11d48)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 14px rgba(244, 63, 94, 0.4)' }}>
                <Activity size={20} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
                Prometheus Telemetry Metrics Explorer
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Real-Time PromQL Scraping & TSDB Metrics Inspector For Node.js Express Backend
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn-cancel" onClick={fetchPrometheusMetrics} title="Refresh Prometheus Feed">
              <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh Metrics
            </button>
            <a
              href="http://localhost:9090"
              target="_blank"
              rel="noreferrer"
              className="nav-link-btn prometheus"
              style={{ background: 'rgba(244, 63, 94, 0.2)', borderColor: 'rgba(244, 63, 94, 0.4)', color: '#fecdd3' }}
            >
              Raw Prometheus UI <ArrowUpRight size={14} />
            </a>
          </div>
        </div>

        {/* Telemetry Quick Cards */}
        <div className="stats-grid">
          <div className="stat-card" style={{ '--stat-accent': '#f43f5e', '--stat-bg': 'rgba(244, 63, 94, 0.15)' }}>
            <div className="stat-icon"><Zap size={20} /></div>
            <div className="stat-label">Total Prom Scraped Requests</div>
            <div className="stat-value" style={{ color: '#f43f5e' }}>{summaryStats.totalRequests}</div>
          </div>
          <div className="stat-card" style={{ '--stat-accent': '#818cf8', '--stat-bg': 'rgba(129, 140, 248, 0.15)' }}>
            <div className="stat-icon"><Cpu size={20} /></div>
            <div className="stat-label">Process Memory Footprint</div>
            <div className="stat-value" style={{ color: '#818cf8' }}>{summaryStats.memoryMb} MB</div>
          </div>
          <div className="stat-card" style={{ '--stat-accent': '#34d399', '--stat-bg': 'rgba(52, 211, 153, 0.15)' }}>
            <div className="stat-icon"><Server size={20} /></div>
            <div className="stat-label">Process Uptime</div>
            <div className="stat-value" style={{ color: '#34d399' }}>{summaryStats.uptimeSeconds}s</div>
          </div>
        </div>
      </div>

      {/* Metric Search & Controls */}
      <div className="controls-bar">
        <div className="search-box" style={{ maxWidth: '100%' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search Prometheus Metric Name Or Description (E.g. http_requests_total, latency, memory)..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Metrics List Accordion */}
      <div style={{ display: 'grid', gap: '1.25rem' }}>
        {filteredMetrics.map((metric, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '1.25rem',
              backdropFilter: 'blur(12px)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    background:
                      metric.type === 'COUNTER'
                        ? 'rgba(99, 102, 241, 0.2)'
                        : metric.type === 'HISTOGRAM'
                        ? 'rgba(245, 158, 11, 0.2)'
                        : 'rgba(16, 185, 129, 0.2)',
                    color:
                      metric.type === 'COUNTER'
                        ? '#a5b4fc'
                        : metric.type === 'HISTOGRAM'
                        ? '#fbbf24'
                        : '#34d399',
                    border: '1px solid var(--border-color)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  {metric.type}
                </span>
                <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', color: '#f8fafc', fontWeight: 600 }}>
                  {metric.name}
                </h3>
              </div>

              <button
                className="btn-cancel"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={() => copyToClipboard(metric.name, metric.name)}
              >
                {copiedQuery === metric.name ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                {copiedQuery === metric.name ? 'Copied PromQL' : 'Copy Name'}
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {metric.help}
            </p>

            {/* Samples Table */}
            {metric.samples.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-subtle)', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Labels / Dimensions</th>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Metric Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metric.samples.slice(0, 15).map((sample, sIdx) => (
                      <tr
                        key={sIdx}
                        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.15s ease' }}
                      >
                        <td style={{ padding: '0.6rem 0.75rem', color: '#cbd5e1' }}>
                          {Object.keys(sample.labels).length > 0 ? (
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {Object.entries(sample.labels).map(([k, v], lIdx) => (
                                <span
                                  key={lIdx}
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  <span style={{ color: '#818cf8' }}>{k}</span>=<span style={{ color: '#f8fafc' }}>"{v}"</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-subtle)' }}>default</span>
                          )}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#34d399' }}>
                          {sample.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>No Active Metric Samples</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
