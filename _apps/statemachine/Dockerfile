FROM node AS base
WORKDIR /app

FROM base AS builder
RUN yarn global add turbo
COPY . .
RUN turbo prune --scope=@typevps/statemachine --docker

# 
FROM base AS installer
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
RUN yarn install

# Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

RUN yarn turbo run build --filter=@typevps/statemachine

FROM base as runner
COPY --from=installer /app .
WORKDIR /app/_apps/statemachine
CMD ["yarn", "start"]