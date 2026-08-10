# syntax=docker/dockerfile:1

# Image de production de l'application web (staging Fly.io, B1.12).
# Multi-étage : on construit avec pnpm dans un monorepo, puis on n'embarque que
# la sortie autonome (`output: "standalone"`) de Next.js.

FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /app

# Installation des dépendances à partir des manifestes (cache Docker efficace).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages ./packages
RUN pnpm install --frozen-lockfile

# Code source puis build du seul paquet web.
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV BUILD_STANDALONE=1
RUN pnpm --filter @missionops/web build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Utilisateur non privilégié.
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Sortie autonome : serveur + dépendances tracées, fichiers statiques, public.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
