const client = require('prom-client');

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Define custom metrics
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

register.registerMetric(httpRequestCounter);
register.registerMetric(httpRequestDuration);

function metricsMiddleware(req, res, next) {
  const start = process.hrtime();

  res.on('finish', () => {
    const elapsed = process.hrtime(start);
    const durationInSeconds = elapsed[0] + elapsed[1] / 1e9;

    // Match route pattern if available (e.g. /api/tasks/:id), fallback to path or 'unmatched'
    let routeName = req.route ? req.route.path : req.baseUrl + (req.path || '');
    if (req.route && req.baseUrl) {
      routeName = req.baseUrl + req.route.path;
    }
    if (!routeName || routeName === '') {
      routeName = req.path || 'unknown';
    }

    // Normalize IDs in route (e.g., /api/tasks/12 -> /api/tasks/:id)
    routeName = routeName.replace(/\/\d+/g, '/:id');

    const statusCode = res.statusCode ? res.statusCode.toString() : '500';
    const method = req.method;

    httpRequestCounter.inc({ method, route: routeName, status_code: statusCode });
    httpRequestDuration.observe({ method, route: routeName, status_code: statusCode }, durationInSeconds);
  });

  next();
}

async function getMetrics() {
  return await register.metrics();
}

function getContentType() {
  return register.contentType;
}

module.exports = {
  register,
  metricsMiddleware,
  getMetrics,
  getContentType
};
