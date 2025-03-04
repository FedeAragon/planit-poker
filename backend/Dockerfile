FROM node:18-alpine
WORKDIR /usr/src/app

# Copiar package.json y package-lock.json desde el contexto (ya es la carpeta backend)
COPY package*.json ./
RUN npm install

# Copiar el resto de los archivos del directorio actual (backend)
COPY . .

EXPOSE 10000
CMD [ "node", "server.js" ]
