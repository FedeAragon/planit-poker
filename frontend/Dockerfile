# frontend/Dockerfile

# Etapa 1: Build de la aplicación React
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa 2: Servir el build con nginx
FROM nginx:alpine

# Copiamos el build de la aplicación al directorio de nginx
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
