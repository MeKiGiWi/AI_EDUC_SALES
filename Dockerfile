FROM node:22-alpine AS builder

WORKDIR /app

ARG EXPO_PUBLIC_SIMULATOR_API_URL=/
ENV EXPO_PUBLIC_SIMULATOR_API_URL=${EXPO_PUBLIC_SIMULATOR_API_URL}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx expo export --platform web

FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
