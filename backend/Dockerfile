# backend/Dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

# Copiamos package.json y package-lock.json (si lo hay)
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto de la aplicación
COPY . .

EXPOSE 3001

CMD [ "node", "server.js" ]
