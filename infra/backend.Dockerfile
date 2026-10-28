FROM node:24.21.0-bookworm-slim
WORKDIR /workspace/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY backend/ ./
COPY docs/foundation_api.json /workspace/docs/foundation_api.json
COPY docs/runtime_api.json /workspace/docs/runtime_api.json
COPY docs/api_contract.yaml /workspace/docs/api_contract.yaml
RUN mkdir -p /workspace/backend/.artifacts/sqlserver && chown -R node:node /workspace/backend/.artifacts
USER node
EXPOSE 3000
CMD ["npm", "start"]
