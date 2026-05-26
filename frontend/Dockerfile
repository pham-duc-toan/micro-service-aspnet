FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_GATEWAY_URL=http://api.tedu.local
ARG VITE_IDENTITY_URL=http://idp.tedu.local
ENV VITE_GATEWAY_URL=$VITE_GATEWAY_URL
ENV VITE_IDENTITY_URL=$VITE_IDENTITY_URL

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
