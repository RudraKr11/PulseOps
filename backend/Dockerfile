# Dockerfile for Node.js REST API Backend
FROM node:20-alpine AS base

# Install sqlite runtime dependencies if needed
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY src/ ./src/

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "src/server.js"]
