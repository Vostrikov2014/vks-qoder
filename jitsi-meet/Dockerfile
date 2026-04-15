# Jitsi Meet Web - Docker Build from Local Project

# Stage 1: Build the application
FROM node:24-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache make python3

# Copy package files first (cache layer)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application (webpack build)
RUN NODE_OPTIONS=--max-old-space-size=8192 npm run build 2>/dev/null || make all

# Stage 2: Create the runtime image with nginx
FROM nginx:alpine AS runtime

# Copy the built application from build directory
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
