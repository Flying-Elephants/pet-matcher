# --- Stage 1: Builder ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL (Required for Prisma Client Generation)
RUN apk add --no-cache openssl

# Copy package files
COPY package.json package-lock.json* ./

# 1. Install ALL dependencies (including devDependencies like Vite/Typescript)
# We override NODE_ENV to ensure dev deps are installed
ENV NODE_ENV=development
RUN npm ci

# Copy source code
COPY . .

# 2. Generate Prisma Client
# This must run BEFORE the build so the types exist
RUN npx prisma generate

# 3. Build the Application
# This uses the dev dependencies we installed above
RUN npm run build

# 4. Clean up
# Remove dev dependencies to keep the final image light
RUN npm prune --production

# --- Stage 2: Production Runner ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install OpenSSL (Required for Prisma Runtime)
RUN apk add --no-cache openssl

# Copy built artifacts and production node_modules from the builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Expose the port
EXPOSE 3000

# Start the app
# Ensure "docker-start" is defined in your package.json, otherwise use "start"
CMD ["npm", "run", "docker-start"]