FROM node:20-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npx tsc

COPY frontend/package*.json frontend/
WORKDIR /app/frontend
RUN npm ci
COPY frontend/ ./
RUN npx vite build

FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist/ ./dist/
COPY --from=build /app/frontend/dist/ ./frontend/dist/

EXPOSE 8080
ENV NODE_ENV=production
RUN mkdir -p /data/uploads && chown node:node /data /data/uploads && chown node:node /app
USER node
CMD ["node", "dist/main.js"]
