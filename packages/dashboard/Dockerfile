FROM node:20-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/dashboard/package.json packages/dashboard/package.json
RUN npm ci --workspace=@node-monitor/dashboard --include-workspace-root
COPY packages/dashboard packages/dashboard
RUN npm run build --workspace=@node-monitor/dashboard

FROM nginx:1.27-alpine
COPY --from=build /repo/packages/dashboard/dist /usr/share/nginx/html
COPY packages/dashboard/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
