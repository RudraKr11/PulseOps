# Task Tracker: Full-Stack Web App with CI/CD & Prometheus/Grafana Monitoring

A production-ready full-stack portfolio application demonstrating modern DevOps practices, containerized microservices architecture, automated CI/CD pipelines, and observability with Prometheus & Grafana.

---

## 📌 Project Overview

This repository contains:
1. **REST API Backend**: Node.js & Express service backed by SQLite database for CRUD task management. Includes Prometheus instrumentation for monitoring request metrics and a health check endpoint.
2. **React Frontend**: Single Page Application built with React 18, Vite, and glassmorphism styling, communicating with the backend API.
3. **Observability Stack**: Prometheus for metric scraping (`/metrics`) and pre-provisioned Grafana dashboards for monitoring real-time telemetry.
4. **CI/CD Pipeline**: GitHub Actions workflow that executes integration tests, builds multi-stage Docker images, publishes them to GitHub Container Registry (`ghcr.io`), and triggers production deployment hooks.

---

## 🏗️ Architecture Diagram

```
                                    ┌──────────────────────┐
                                    │    React Frontend    │
                                    │  (Port 8088 / Nginx) │
                                    └──────────┬───────────┘
                                               │
                                       HTTP / API Calls
                                               │
                                               ▼
┌──────────────────────┐            ┌──────────────────────┐
│  Prometheus Server   │ ──Scrapes─►│  Express API Server  │
│     (Port 9090)      │  /metrics  │ (Container Port 5000)│
└──────────┬───────────┘            └──────────┬───────────┘
           │                                   │
     Reads Metrics                             │ Database I/O
           │                                   ▼
           ▼                        ┌──────────────────────┐
┌──────────────────────┐            │  SQLite Persistent   │
│  Grafana Dashboard   │            │       Database       │
│     (Port 3000)      │            └──────────────────────┘
└──────────────────────┘
```

---

## 🚀 How to Run Locally with Docker Compose

Ensure Docker and Docker Compose are installed on your machine.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/task-tracker.git
   cd task-tracker
   ```

2. **Start all services with a single command**:
   ```bash
   docker compose up --build
   ```

3. **Access Services**:
   - 🌐 **Frontend App**: [http://localhost:8088](http://localhost:8088)
   - ⚡ **Backend API Health**: [http://localhost:5001/health](http://localhost:5001/health)
   - 📊 **Prometheus Metrics**: [http://localhost:5001/metrics](http://localhost:5001/metrics)
   - 📈 **Prometheus UI**: [http://localhost:9090](http://localhost:9090)
   - 🖥️ **Grafana Dashboard**: [http://localhost:3000](http://localhost:3000)

---

## 📊 Viewing the Grafana Dashboard

Grafana is pre-provisioned out of the box with the default Prometheus datasource and a custom dashboard:

1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Log in using default credentials:
   - **Username**: `admin`
   - **Password**: `admin`
3. Navigate to **Dashboards** > **Task Tracker API Overview**.
4. The dashboard displays 3 live panels:
   - **Request Rate (QPS)**: `sum(rate(http_requests_total[1m])) by (method, route)`
   - **Error Rate (4xx/5xx)**: `sum(rate(http_requests_total{status_code=~"4..|5.."}[1m]))`
   - **p95 Latency**: `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[1m])) by (le))`

---

## 🔄 CI/CD Pipeline Workflow

The workflow `.github/workflows/ci-cd.yml` automates testing, container image publishing, and deployment on every `push` to `main`:

```
┌─────────────────┐     ┌─────────────────────┐     ┌──────────────────────┐
│  Run Automated  │ ──► │  Build & Push Docker │ ──► │  Trigger Production  │
│   Jest Tests    │     │   Images to GHCR    │     │   Deployment Hook    │
└─────────────────┘     └─────────────────────┘     └──────────────────────┘
```

1. **Test Stage**: Runs unit/integration tests with `jest` and `supertest` inside Node 20 environment.
2. **Build & Push Stage**: Builds multi-stage Docker images for both `backend` and `frontend` and pushes them to GitHub Container Registry (`ghcr.io`).
3. **Deployment Stage**: Triggers a webhook deployment to Render or Railway using repository secret `RENDER_DEPLOY_HOOK_URL`.

---

## 🧪 Running Backend Tests Locally

```bash
cd backend
npm install
npm test
```
