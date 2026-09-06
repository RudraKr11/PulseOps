import React, { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';

export default function TaskForm({ onSubmit, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Capitalize Title Words Automatically
    const formattedTitle = title
      .trim()
      .split(' ')
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
      .join(' ');

    onSubmit({ title: formattedTitle, description: description.trim(), status });
    setTitle('');
    setDescription('');
    setStatus('pending');
  };

  return (
    <div className="form-modal-overlay">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
            <PlusCircle size={18} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
            Create New Task
          </h2>
        </div>
        <button className="btn-icon-action" onClick={onCancel} title="Close Form">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Task Title *</label>
          <input
            type="text"
            className="form-input"
            placeholder="E.g. Implement Grafana Alerting Rules"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            className="form-textarea"
            rows="3"
            placeholder="Add Detailed Context, Parameters, Or Documentation Notes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Initial Status</label>
          <select
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-new-task">
            Save Task
          </button>
        </div>
      </form>
    </div>
  );
}
