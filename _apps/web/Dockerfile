FROM node AS base
WORKDIR /app

FROM base AS builder
RUN yarn global add turbo
COPY . .
RUN turbo prune --scope=@typevps/web --docker

# 
FROM base AS installer
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
RUN yarn install

# Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

RUN yarn turbo run build --filter=@typevps/web

FROM devforth/spa-to-http:latest
COPY --from=installer /app/_apps/web/dist . 
