FROM node:22-bookworm AS build
WORKDIR /app
ENV NODE_OPTIONS=--max-old-space-size=4096
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN test -f dist/active-recall-front/browser/index.html

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/active-recall-front/browser /usr/share/nginx/html
