FROM node:24-slim AS build
WORKDIR /app
COPY package*.json ./
COPY frontend/package.json frontend/
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npx tsc

COPY frontend/ ./frontend/
WORKDIR /app/frontend
RUN npx vite build

FROM node:24-slim
WORKDIR /app
COPY package*.json ./
COPY frontend/package.json frontend/
RUN npm ci --omit=dev

COPY --from=build /app/dist/ ./dist/
COPY --from=build /app/frontend/dist/ ./frontend/dist/

# Único utilitário chamado dentro da imagem; testes/deploy/legado ficam no runner/host.
COPY scripts/seed-demo.mjs ./scripts/seed-demo.mjs

EXPOSE 8080
ENV NODE_ENV=production
RUN mkdir -p /data/uploads && chown node:node /data /data/uploads && chown node:node /app
USER node
CMD ["node", "dist/main.js"]
