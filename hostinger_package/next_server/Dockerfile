## Dockerfile for running Next.js server in production
FROM node:20-alpine
WORKDIR /app

# Install deps and build (if you prefer building inside container)
COPY package.json package-lock.json* ./
RUN npm ci --production=false

# Copy rest (if you already have .next built, it's fine)
COPY . .

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]
FROM node:20-trixie-slim AS base
LABEL maintainer="mrazota"
WORKDIR /app

# Ensure noninteractive apt (avoid debconf prompts) and apply distro upgrades early
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates curl gnupg dirmngr \
	# attempt to upgrade OS packages that commonly report vulnerabilities (zlib, libpam)
	&& apt-get upgrade -y --only-upgrade \
	&& apt-get install -y --no-install-recommends --only-upgrade zlib1g libpam-modules libpam-modules-bin libpam-runtime libpam0g || true \
	&& rm -rf /var/lib/apt/lists/*

# Upgrade npm in the base image so the bundled npm's dependencies (for example
# cross-spawn) are updated too. This targets findings that originate from
# /usr/local/lib/node_modules/npm/node_modules/... which Trivy reports as part
# of the image OS layer. Use a modern npm that is compatible with Node 20.
RUN set -eux; \
    if command -v npm >/dev/null 2>&1; then \
        npm install -g npm@11.6.2 --no-audit --no-fund || true; \
    fi

FROM base AS builder
ENV NODE_ENV=production

# Copy package files first for clean npm install layer caching
# Copy package files first and require the lockfile for reproducible installs
COPY package.json package-lock.json ./
# Install dependencies inside the builder. Use a small retry loop to handle
# transient network issues during `npm ci`.
RUN set -eux; \
		n=0; \
		until [ "$n" -ge 4 ]; do \
			npm ci --no-audit --no-fund && break || true; \
			n=$((n+1)); \
			echo "npm ci failed, retry #$n"; \
			sleep 2; \
		done; \
		if [ "$n" -ge 4 ]; then \
			echo "npm ci failed after retries"; exit 1; \
		fi

# Copy the rest and build
COPY . .
RUN mkdir -p public || true
RUN npm run build

# Prune dev deps to reduce final image size
RUN npm prune --production || true

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Keep runtime minimal: install only ca-certificates and tini, then clean apt lists.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates tini \
    && rm -rf /var/lib/apt/lists/*

# Copy app artifacts from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js

# Create a non-root user and fix permissions
RUN if getent passwd 1000 >/dev/null 2>&1; then \
		useradd -m nextuser || true; \
	else \
		useradd -m -u 1000 nextuser || true; \
	fi \
	&& chown -R nextuser:nextuser /app || true
USER nextuser

EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "node_modules/.bin/next", "start", "-p", "3000"]

# Lightweight healthcheck for container orchestration platforms — ensures
# the app responds on the configured port. Uses curl in a non-blocking way.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD curl --fail http://127.0.0.1:3000/ || exit 1
