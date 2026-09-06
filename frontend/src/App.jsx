import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  CheckSquare,
  Activity,
  ExternalLink,
  RefreshCw,
  BarChart3,
  Search,
  CheckCircle2,
  Clock,
  PlayCircle,
  ListTodo,
  TrendingUp,
  Cpu,
  Server,
  Zap,
  Target,
  Gauge,
  LayoutGrid
} from 'lucide-react';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import PrometheusExplorer from './components/PrometheusExplorer';

export default function App() {
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' or 'prometheus'
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [health, setHealth] = useState({ status: 'CHECKING', uptime: 0 });
  const [requestCount, setRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const capitalizeWords = (str) => {
    if (!str) return '';
    return str
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch('/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      } else {
        setHealth({ status: 'DOWN' });
      }
    } catch {
      setHealth({ status: 'DOWN' });
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/metrics');
      if (res.ok) {
        const text = await res.text();
        const matches = text.match(/http_requests_total\{[^}]*\}\s+(\d+)/g);
        if (matches) {
          let sum = 0;
          matches.forEach((m) => {
            const num = parseInt(m.split(/\s+/).pop(), 10);
            if (!isNaN(num)) sum += num;
          });
          setRequestCount(sum);
        }
      }
    } catch (err) {
      console.error('Failed to parse Prometheus metrics:', err);
    }
  };

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const result = await res.json();
      if (result.success) {
        setTasks(result.data);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError('Could Not Connect To API Server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    fetchMetrics();
    fetchTasks();
    const interval = setInterval(() => {
      fetchHealth();
      fetchMetrics();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const handleCreateTask = async (taskData) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      if (res.ok) {
        setShowForm(false);
        fetchTasks();
        fetchHealth();
        fetchMetrics();
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchTasks();
        fetchMetrics();
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTasks();
        fetchMetrics();
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Compute counts & percentages across full task set
  const totalCount = tasks.length;
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filter tasks based on selected status & search query
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesStatus = filter === 'all' || t.status === filter;
      const matchesSearch =
        searchQuery.trim() === '' ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [tasks, filter, searchQuery]);

  const buildPrometheusQueryUrl = (query) => {
    return `http://localhost:9090/graph?g0.expr=${encodeURIComponent(query)}&g0.tab=0`;
  };

  return (
    <div className="container">
      {/* App Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon-wrapper">
            <div className="brand-icon">
              <CheckSquare size={24} />
            </div>
          </div>
          <div>
            <h1>Task Tracker & Observability Hub</h1>
            <p>
              Full-Stack Microservices Telemetry Stack <span className="badge-tag">v1.0.0</span>
            </p>
          </div>
        </div>

        <div className="header-actions">
          <span className={`status-pill-live ${health.status === 'UP' ? '' : 'down'}`}>
            <span className="pulse-dot"></span>
            API Health: {health.status}
          </span>
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="nav-link-btn grafana"
            title="Open Grafana Telemetry Dashboard (Login: admin / admin)"
          >
            <BarChart3 size={15} style={{ color: '#f59e0b' }} /> Grafana Dashboard
            <ExternalLink size={12} />
          </a>
          <a
            href="http://localhost:9090"
            target="_blank"
            rel="noreferrer"
            className="nav-link-btn prometheus"
            title="Open Raw Prometheus Go UI"
          >
            <Activity size={15} style={{ color: '#f43f5e' }} /> Raw Prometheus
            <ExternalLink size={12} />
          </a>
        </div>
      </header>

      {/* Main View Mode Selector Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '0.35rem',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          marginBottom: '2rem'
        }}
      >
        <button
          className={`filter-pill ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
          style={{ flex: 1, padding: '0.65rem 1.25rem', fontSize: '0.925rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <LayoutGrid size={17} /> Task Management Hub
        </button>
        <button
          className={`filter-pill ${activeTab === 'prometheus' ? 'active' : ''}`}
          onClick={() => setActiveTab('prometheus')}
          style={{
            flex: 1,
            padding: '0.65rem 1.25rem',
            fontSize: '0.925rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            background: activeTab === 'prometheus' ? 'linear-gradient(135deg, #f43f5e, #e11d48)' : 'transparent',
            boxShadow: activeTab === 'prometheus' ? '0 4px 14px rgba(244, 63, 94, 0.4)' : 'none'
          }}
        >
          <Activity size={17} /> Prometheus Metrics Hub & Explorer
        </button>
      </div>

      {activeTab === 'prometheus' ? (
        /* PROMETHEUS EXPLORER VIEW */
        <PrometheusExplorer health={health} />
      ) : (
        /* TASK MANAGEMENT VIEW */
        <>
          {/* Observability Telemetry Live Strip */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '1rem 1.25rem',
              marginBottom: '1.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
              backdropFilter: 'blur(12px)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#a5b4fc' }}>
                <Server size={16} /> Backend Runtime: Node.js Express
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#34d399' }}>
                <Zap size={16} /> Total API Requests Processed: <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>{requestCount}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#fbbf24' }}>
                <Cpu size={16} /> Prometheus Scraper: <span style={{ color: '#34d399' }}>Active (/metrics)</span>
              </div>
            </div>

            <a
              href="/metrics"
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                fontFamily: 'var(--font-mono)',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}
            >
              View Raw /metrics Endpoint
            </a>
          </div>

          {/* Prometheus One-Click Query Launcher */}
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.06)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              borderRadius: '16px',
              padding: '1.15rem 1.25rem',
              marginBottom: '2rem',
              backdropFilter: 'blur(12px)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f43f5e', fontWeight: 700, fontFamily: 'var(--font-heading)', fontSize: '0.975rem' }}>
                <Activity size={18} /> Prometheus PromQL Quick-Query Launcher
              </div>
              <a
                href="http://localhost:9090/targets"
                target="_blank"
                rel="noreferrer"
                className="nav-link-btn"
                style={{ fontSize: '0.775rem', padding: '0.25rem 0.6rem' }}
              >
                <Target size={13} /> View Scrape Targets
              </a>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <a
                href={buildPrometheusQueryUrl('http_requests_total')}
                target="_blank"
                rel="noreferrer"
                className="nav-link-btn"
                style={{ fontSize: '0.8rem', background: 'rgba(244, 63, 94, 0.1)', borderColor: 'rgba(244, 63, 94, 0.3)', color: '#fecdd3' }}
              >
                <Zap size={13} /> Total Requests Counter
              </a>
              <a
                href={buildPrometheusQueryUrl('rate(http_requests_total[1m])')}
                target="_blank"
                rel="noreferrer"
                className="nav-link-btn"
                style={{ fontSize: '0.8rem', background: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.3)', color: '#a5b4fc' }}
              >
                <Gauge size={13} /> Request Rate (QPS)
              </a>
              <a
                href={buildPrometheusQueryUrl('histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[1m])) by (le))')}
                target="_blank"
                rel="noreferrer"
                className="nav-link-btn"
                style={{ fontSize: '0.8rem', background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)', color: '#fde68a' }}
              >
                <Clock size={13} /> p95 Latency Quantile
              </a>
              <a
                href={buildPrometheusQueryUrl('sum(http_requests_total{status_code=~"4..|5.."})')}
                target="_blank"
                rel="noreferrer"
                className="nav-link-btn"
                style={{ fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
              >
                <Activity size={13} /> Error Rate Filter
              </a>
            </div>
          </div>

          {/* Progress & Overview Banner */}
          <div className="dashboard-banner">
            <div className="banner-header">
              <div className="banner-title">
                <TrendingUp size={20} style={{ color: '#818cf8' }} /> Task Completion Rate
              </div>
              <div style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#10b981' }}>
                {completionPercentage}%
              </div>
            </div>

            <div className="progress-container">
              <div className="progress-meta">
                <span>{completedCount} Of {totalCount} Tasks Completed</span>
                <span>{totalCount - completedCount} Remaining</span>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            {/* 4 Stat Cards */}
            <div className="stats-grid">
              <div className="stat-card" style={{ '--stat-accent': '#818cf8', '--stat-bg': 'rgba(129, 140, 248, 0.12)' }}>
                <div className="stat-icon"><ListTodo size={20} /></div>
                <div className="stat-label">Total Tasks</div>
                <div className="stat-value">{totalCount}</div>
              </div>
              <div className="stat-card" style={{ '--stat-accent': '#fbbf24', '--stat-bg': 'rgba(251, 191, 36, 0.12)' }}>
                <div className="stat-icon"><Clock size={20} /></div>
                <div className="stat-label">Pending</div>
                <div className="stat-value" style={{ color: '#fbbf24' }}>{pendingCount}</div>
              </div>
              <div className="stat-card" style={{ '--stat-accent': '#a5b4fc', '--stat-bg': 'rgba(165, 180, 252, 0.12)' }}>
                <div className="stat-icon"><PlayCircle size={20} /></div>
                <div className="stat-label">In Progress</div>
                <div className="stat-value" style={{ color: '#a5b4fc' }}>{inProgressCount}</div>
              </div>
              <div className="stat-card" style={{ '--stat-accent': '#34d399', '--stat-bg': 'rgba(52, 211, 153, 0.12)' }}>
                <div className="stat-icon"><CheckCircle2 size={20} /></div>
                <div className="stat-label">Completed</div>
                <div className="stat-value" style={{ color: '#34d399' }}>{completedCount}</div>
              </div>
            </div>
          </div>

          {/* Controls & Filter Bar */}
          <div className="controls-bar">
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search Tasks By Title Or Description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-pills">
              {['all', 'pending', 'in_progress', 'completed'].map((f) => (
                <button
                  key={f}
                  className={`filter-pill ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All Tasks' : capitalizeWords(f)}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-cancel" onClick={fetchTasks} title="Refresh Task List">
                <RefreshCw size={16} />
              </button>
              <button className="btn-new-task" onClick={() => setShowForm(!showForm)}>
                <Plus size={18} /> {showForm ? 'Close Form' : 'New Task'}
              </button>
            </div>
          </div>

          {/* Form Drawer */}
          {showForm && (
            <TaskForm
              onSubmit={handleCreateTask}
              onCancel={() => setShowForm(false)}
            />
          )}

          {/* Task List Grid */}
          {error ? (
            <div className="empty-container">
              <p style={{ color: 'var(--danger)', fontWeight: 600 }}>{error}</p>
              <button className="btn-cancel" style={{ marginTop: '1rem' }} onClick={fetchTasks}>
                Retry API Connection
              </button>
            </div>
          ) : loading ? (
            <div className="empty-container">
              <p>Syncing Task Telemetry...</p>
            </div>
          ) : (
            <TaskList
              tasks={filteredTasks}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteTask}
              currentFilter={filter}
              searchQuery={searchQuery}
            />
          )}
        </>
      )}
    </div>
  );
}
