# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only the API package files
COPY apps/api/package*.json ./apps/api/

# Install dependencies inside the API folder
WORKDIR /app/apps/api
RUN npm install --omit=dev --legacy-peer-deps

# Copy the rest of the API source code
COPY apps/api/ .

# Build the API
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built artifacts and node_modules from builder
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/package*.json ./
COPY --from=builder /app/apps/api/src/i18n ./src/i18n

EXPOSE 4000

CMD ["node", "dist/main.js"]
