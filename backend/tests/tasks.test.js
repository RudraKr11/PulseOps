const request = require('supertest');
const app = require('../src/app');
const { getDb, initDb, closeDb } = require('../src/db');

let testDb;

beforeAll(async () => {
  // Use in-memory DB for tests
  testDb = getDb(':memory:');
  await initDb(testDb);
});

afterAll(async () => {
  await closeDb(testDb);
});

describe('Task Tracker API', () => {
  let createdTaskId;

  test('GET /health should return 200 and UP status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body).toHaveProperty('timestamp');
  });

  test('GET /metrics should return Prometheus metrics format', async () => {
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('http_request_duration_seconds');
  });

  test('POST /api/tasks should create a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({
        title: 'Test Build Pipeline',
        description: 'Verify CI/CD integration works cleanly',
        status: 'pending'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.title).toBe('Test Build Pipeline');
    expect(res.body.data.status).toBe('pending');

    createdTaskId = res.body.data.id;
  });

  test('POST /api/tasks should return 400 if title is missing', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ description: 'No title provided' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/tasks should return list containing created task', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('PUT /api/tasks/:id should update task status', async () => {
    const res = await request(app)
      .put(`/api/tasks/${createdTaskId}`)
      .send({ status: 'completed' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('completed');
  });

  test('DELETE /api/tasks/:id should remove task', async () => {
    const res = await request(app).delete(`/api/tasks/${createdTaskId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const checkRes = await request(app).get(`/api/tasks/${createdTaskId}`);
    expect(checkRes.statusCode).toBe(404);
  });
});
