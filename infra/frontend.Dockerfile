FROM node:24.21.0-bookworm-slim AS build
WORKDIR /workspace/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
ENV VITE_API_URL=/api
RUN npm run build
FROM nginx:1.28.0-alpine
COPY --from=build /workspace/frontend/dist /usr/share/nginx/html
COPY infra/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
