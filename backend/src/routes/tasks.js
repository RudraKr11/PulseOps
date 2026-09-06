const express = require('express');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../db');

// GET /api/tasks - List all tasks (optional status query parameter)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM tasks ORDER BY created_at DESC';
    let params = [];

    if (status && ['pending', 'in_progress', 'completed'].includes(status)) {
      sql = 'SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC';
      params = [status];
    }

    const tasks = await dbAll(sql, params);
    res.json({ success: true, data: tasks });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id - Get a single task by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [id]);

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.json({ success: true, data: task });
  } catch (err) {
    console.error('Error fetching task:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch task' });
  }
});

// POST /api/tasks - Create a new task
router.post('/', async (req, res) => {
  try {
    const { title, description = '', status = 'pending' } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ success: false, error: 'Task title is required' });
    }

    const validStatuses = ['pending', 'in_progress', 'completed'];
    const taskStatus = validStatuses.includes(status) ? status : 'pending';

    const result = await dbRun(
      'INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)',
      [title.trim(), description.trim(), taskStatus]
    );

    const newTask = await dbGet('SELECT * FROM tasks WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, data: newTask });
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    const existing = await dbGet('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const validStatuses = ['pending', 'in_progress', 'completed'];
    const newTitle = title !== undefined ? title.trim() : existing.title;
    const newDesc = description !== undefined ? description.trim() : existing.description;
    const newStatus = status && validStatuses.includes(status) ? status : existing.status;

    if (!newTitle) {
      return res.status(400).json({ success: false, error: 'Title cannot be empty' });
    }

    await dbRun(
      'UPDATE tasks SET title = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newTitle, newDesc, newStatus, id]
    );

    const updatedTask = await dbGet('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json({ success: true, data: updatedTask });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ success: false, error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dbGet('SELECT * FROM tasks WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    await dbRun('DELETE FROM tasks WHERE id = ?', [id]);
    res.json({ success: true, message: `Task ${id} deleted successfully` });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ success: false, error: 'Failed to delete task' });
  }
});

module.exports = router;
