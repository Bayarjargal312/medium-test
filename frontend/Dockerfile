# Build static frontend with Vite and serve via Nginx

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund || npm i --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .
# Nginx config will be mounted/copied by compose to enable SPA + proxy


