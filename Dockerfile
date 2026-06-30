# Multi-stage build: compile the static site with Node, then serve it with nginx.
# Stage 1 ("build") needs the full toolchain (Node + pnpm + dev deps) only long
# enough to produce dist/. Stage 2 ("serve") is a tiny nginx image that ships
# just those built files — so the running container has no Node, no source, no
# node_modules. This mirrors the build-in-Docker pattern already used for
# padeltrack on the home server, while keeping the runtime static like my-website.

# ---- Stage 1: build the app ----
FROM node:22-alpine AS build
WORKDIR /app

# pnpm@10 reads this repo's lockfileVersion 9.0. Pinning it keeps builds
# reproducible no matter which pnpm is globally current.
RUN npm install -g pnpm@10

# Copy only the manifest + lockfile first so Docker can cache the (slow)
# dependency install layer and skip it when only source code changes.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Now bring in the rest of the source and produce the static build (dist/).
COPY . .
RUN pnpm build

# ---- Stage 2: serve the static files ----
FROM nginx:alpine AS serve

# Our SPA-aware server config (deep-link fallback + PWA-safe cache headers).
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# The compiled site from stage 1 — nothing else comes across.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
