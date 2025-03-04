FROM node:18-alpine
WORKDIR /usr/src/app
# Copiamos package.json y package-lock.json desde el subdirectorio backend
COPY ./backend/package*.json ./
RUN npm install
# Copiamos todo el contenido del subdirectorio backend
COPY ./backend .
EXPOSE 3001
CMD [ "node", "server.js" ]
