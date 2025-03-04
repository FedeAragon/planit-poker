# Etapa 1: Build de la aplicación React
FROM node:18-alpine AS build

WORKDIR /app

# Copiar package.json y package-lock.json desde el contexto (ya es el directorio frontend)
COPY package*.json ./
RUN npm install

# Copiar el resto de los archivos del directorio actual (frontend)
COPY . .
RUN npm run build

# Etapa 2: Servir el build con nginx
FROM nginx:alpine

# Copiar el build de la aplicación al directorio de nginx
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
