FROM node AS base
WORKDIR /app
RUN apt-get update

FROM base AS builder
RUN yarn global add turbo
COPY . .
RUN turbo prune --scope=@typevps/api --docker

# 
FROM base AS installer
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
RUN yarn install

# Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

RUN yarn turbo run build --filter=@typevps/api

FROM base as runner
RUN apt-get install -y libguestfs-tools

COPY --from=installer /app .
WORKDIR /app/_apps/api
CMD ["yarn", "start"]