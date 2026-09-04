FROM node:20-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/api/package.json packages/api/package.json
RUN npm ci --workspace=@node-monitor/api --include-workspace-root
COPY packages/api packages/api
RUN npm run build --workspace=@node-monitor/api

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/api/dist ./packages/api/dist
COPY --from=build /repo/packages/api/package.json ./packages/api/package.json
EXPOSE 3001
CMD ["node", "packages/api/dist/main.js"]
