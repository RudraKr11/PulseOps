import React from 'react';
import { Check, Clock, PlayCircle, CheckCircle2, Trash2, Calendar } from 'lucide-react';

export default function TaskItem({ task, onStatusChange, onDelete }) {
  const isCompleted = task.status === 'completed';

  const toggleCheck = () => {
    const nextStatus = isCompleted ? 'pending' : 'completed';
    onStatusChange(task.id, nextStatus);
  };

  const capitalizeWords = (str) => {
    if (!str) return '';
    return str
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusIcons = {
    pending: <Clock size={13} />,
    in_progress: <PlayCircle size={13} />,
    completed: <CheckCircle2 size={13} />
  };

  return (
    <div className={`task-card ${isCompleted ? 'is-completed' : ''}`}>
      <div className="task-content">
        <div
          className={`checkbox-custom ${isCompleted ? 'checked' : ''}`}
          onClick={toggleCheck}
          title={isCompleted ? 'Mark As Pending' : 'Mark As Completed'}
        >
          {isCompleted && <Check size={14} strokeWidth={3} />}
        </div>

        <div className="task-details">
          <div className="task-header-line">
            <h3 className={`task-title ${isCompleted ? 'completed' : ''}`}>
              {capitalizeWords(task.title)}
            </h3>
            <span className={`status-badge ${task.status}`}>
              {statusIcons[task.status]}
              {capitalizeWords(task.status)}
            </span>
          </div>

          {task.description && <p className="task-desc">{task.description}</p>}

          <div className="task-footer-meta">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={13} /> Created: {formatDate(task.created_at)}
            </span>
          </div>
        </div>
      </div>

      <div className="task-actions">
        <select
          className="form-select"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', width: 'auto', borderRadius: '10px' }}
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <button
          className="btn-icon-action delete"
          title="Delete Task"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
