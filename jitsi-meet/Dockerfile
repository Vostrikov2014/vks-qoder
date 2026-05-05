# Jitsi Meet Web - Docker Build from Local Project

# Stage 1: Build the application
FROM node:24-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache make python3

# Configure npm: raise idle/fetch timeouts and retry counts to survive slow registry connections
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set maxsockets 3

# Copy package files first (cache layer)
COPY package.json package-lock.json ./

# Install dependencies (--legacy-peer-deps required: jitsi-meet mixes web+RN deps with intentional peer conflicts)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the application (make all = compile + deploy)
RUN make all

# Stage 2: Create the runtime image with nginx
FROM nginx:alpine AS runtime

# Copy the complete Jitsi Meet web application
# After `make all`, the runtime files are in the project root:
#   *.html, *.js — app entry points and config
#   libs/        — deployed JS bundles (webpack output + dependencies)
#   css/         — compiled styles (all.css)
#   fonts/, images/, sounds/, lang/, static/ — static assets
COPY --from=builder /app/*.html /usr/share/nginx/html/
COPY --from=builder /app/*.js /usr/share/nginx/html/
COPY --from=builder /app/libs /usr/share/nginx/html/libs
COPY --from=builder /app/css /usr/share/nginx/html/css
COPY --from=builder /app/fonts /usr/share/nginx/html/fonts
COPY --from=builder /app/images /usr/share/nginx/html/images
COPY --from=builder /app/sounds /usr/share/nginx/html/sounds
COPY --from=builder /app/lang /usr/share/nginx/html/lang
COPY --from=builder /app/static /usr/share/nginx/html/static
COPY --from=builder /app/resources /usr/share/nginx/html/resources

# Copy nginx configuration
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
