const express = require('express');
const cors = require('cors');
const { metricsMiddleware, getMetrics, getContentType } = require('./metrics');
const tasksRouter = require('./routes/tasks');

const app = express();

app.use(cors());
app.use(express.json());

// Track all requests with Prometheus metrics
app.use(metricsMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', getContentType());
    const metrics = await getMetrics();
    res.end(metrics);
  } catch (err) {
    res.status(500).end(err);
  }
});

// Task Tracker API routes
app.use('/api/tasks', tasksRouter);

// 404 Fallback
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

module.exports = app;
