# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY .env.production .env
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
# COPY nginx.conf /etc/nginx/nginx.conf # Nếu có custom nginx.conf, bỏ comment dòng này
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 