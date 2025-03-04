FROM node:18-alpine AS build

WORKDIR /app

# Copiar los archivos package.json y package-lock.json desde el subdirectorio frontend
COPY ./frontend/package*.json ./
RUN npm install

# Copiar el resto de los archivos del directorio frontend
COPY ./frontend .
RUN npm run build

FROM nginx:alpine

# Copiar el build de la aplicación al directorio de nginx
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
