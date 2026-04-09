# need to configure this for Cloud Build / Cloud Run 
# b/c buildpack doesn't know what to do with typescript
# https://stackoverflow.com/a/71619945/10887890
# Secret manager with Cloud Build (testing?) 
# https://cloud.google.com/build/docs/securing-builds/use-secrets

# example src: https://firebase.google.com/docs/hosting/cloud-run

# STAGE 1: BUILD DEV
FROM node:22-alpine AS builder

# Create and change to the app directory.
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy application dependency manifests to the container image.
# Copying separately avoids re-running npm install on every code change.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# COPY package.json pnpm-lock.yaml ./

# build context at root of monorepo if using pnpm workspaces
# Copy workspace packages needed for the api build
COPY common/package.json ./common/
COPY api/package.json ./api/

# Install production & dev dependencies.
RUN pnpm install --frozen-lockfile

# Copy local code to the container image. Copy source for packages we need to build
# COPY . .
COPY common/ ./common/
COPY api/ ./api/

# RUN pnpm build
# Build common first, then api
# RUN pnpm --filter @idemand/common build
# RUN pnpm --filter api build
RUN pnpm turbo run build --filter=api


# STAGE 2: BUILD PRODUCTION
FROM node:22-alpine as production

# expose emulator ports in dev ??
# EXPOSE 8082
# EXPOSE 9091
# EXPOSE 5001

# example: pass variables at runtime
# ARG NODE_ENV=development
# ENV NODE_ENV=${NODE_ENV}
# TODO: read into env vars
# expect a build-time variable
# ARG A_VARIABLE
# use the value to set the ENV var default
# ENV an_env_var=$A_VARIABLE

ARG PROJECT_ID=idemand-submissions
ARG GOOGLE_CLOUD_PROJECT=idemand-submissions
ARG GCLOUD_PROJECT=idemand-submissions
ARG PROJECT_ID_NUMBER=234623719115
# ARG PROJECT_ID=idemand-submissions-dev
# ARG GOOGLE_CLOUD_PROJECT=idemand-submissions-dev
# ARG GCLOUD_PROJECT=idemand-submissions-dev
# ARG PROJECT_ID_NUMBER=704781428847

ENV PROJECT_ID=${PROJECT_ID}
ENV GOOGLE_CLOUD_PROJECT=${GOOGLE_CLOUD_PROJECT}
ENV GCLOUD_PROJECT=${GCLOUD_PROJECT}
ENV PROJECT_NUMBER=${PROJECT_NUMBER}
ENV SWISS_RE_TOOL_CODE=IDEMAND_ROCKINGHAM
ENV SWISS_RE_PRODUCT_CODE=US_FLOOD

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# COPY package.json pnpm-lock.yaml ./
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY common/package.json ./common/
COPY api/package.json ./api/

RUN pnpm install --frozen-lockfile --prod
# "WARN config only Use `--omit=dev` to omit dev dependencies from the install" when running gcloud deploy

# copy files from one stage (development) to another stage (production)
# COPY --from=builder /app/dist ./dist
COPY --from=builder /app/common/dist ./common/dist
COPY --from=builder /app/api/dist ./api/dist

WORKDIR /app/api

# Run the web service on container startup.
# CMD [ "npm", "start" ]
CMD ["node", "dist/index.js"]