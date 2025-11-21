# Stage 1 - build
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build

# Stage 2 - runtime
FROM node:20-alpine AS runtime
WORKDIR /usr/src/app
ENV NODE_ENV=production
# optional: create non-root user
RUN addgroup -S app && adduser -S -G app app
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/.env.example ./.env.example
# copy entrypoint script and make executable
COPY scripts/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
USER app
EXPOSE 3000
CMD ["/usr/local/bin/entrypoint.sh"]
