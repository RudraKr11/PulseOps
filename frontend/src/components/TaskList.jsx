import React from 'react';
import TaskItem from './TaskItem';
import { Layers } from 'lucide-react';

export default function TaskList({ tasks, onStatusChange, onDelete, currentFilter, searchQuery }) {
  const capitalizeWords = (str) => {
    if (!str) return '';
    return str
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (tasks.length === 0) {
    return (
      <div className="empty-container">
        <div className="empty-icon">
          <Layers size={28} />
        </div>
        <h3>No Tasks Found</h3>
        <p>
          {searchQuery
            ? `No Matching Tasks For Query "${searchQuery}".`
            : currentFilter === 'all'
            ? 'Your Task List Is Empty. Click "New Task" To Create Your First Item.'
            : `No Tasks Found Under Status "${capitalizeWords(currentFilter)}".`}
        </p>
      </div>
    );
  }

  return (
    <div>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
