const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*" }
});

// Variables para almacenar las tareas y el estado de los votos
let tasks = []; // Cada tarea: { id, title, votes: { userName: vote } }

// Configuración de multer para subir archivos
const upload = multer({ dest: 'uploads/' });

// Ruta para subir el CSV de tareas
app.post('/upload-csv', upload.single('file'), (req, res) => {
    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv({ headers: false }))  // Asumimos que cada línea tiene un solo valor (título)
        .on('data', (data) => {
            // data es un objeto, por ejemplo: { '0': 'Título de la tarea' }
            const title = data[0];
            results.push({ id: results.length, title, votes: {} });
        })
        .on('end', () => {
            tasks = results;
            res.json({ tasks });
            // Eliminamos el archivo temporal
            fs.unlinkSync(req.file.path);
        });
});

// Ruta para obtener las tareas (opcional, para refrescar desde el frontend)
app.get('/tasks', (req, res) => {
    res.json({ tasks });
});

// Manejo de conexiones en tiempo real con Socket.io
io.on('connection', (socket) => {
    console.log('Nuevo usuario conectado:', socket.id);

    socket.on('join', (userName) => {
        socket.userName = userName;
        socket.join('global');
        console.log(`${userName} se ha unido a la sala global`);
        socket.emit('loadTasks', tasks);
    });
    /*
    socket.on('vote', ({ taskId, vote }) => {
        let task = tasks.find(t => t.id === taskId);
        if (task) {
            task.votes[socket.userName] = vote;
            io.to('global').emit('taskUpdated', task);

            // Verificar si todos los usuarios conectados han votado
            const clients = io.sockets.adapter.rooms.get('global');
            const numClients = clients ? clients.size : 0;
            if (Object.keys(task.votes).length >= numClients && numClients > 0) {
                io.to('global').emit('allVoted', taskId);
            }
        }
    });
    */

    socket.on('reveal', (taskId) => {
        let task = tasks.find(t => t.id === taskId);
        if (task) {
            io.to('global').emit('revealVotes', task);
        }
    });

    // Evento para eliminar (pasar) la tarea actual
    socket.on('removeTask', (taskId) => {
        tasks = tasks.filter(task => task.id !== taskId);
        io.to('global').emit('taskRemoved', taskId);
        console.log(`Tarea con id ${taskId} eliminada`);
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
    });

    // Evento para agregar una nueva tarea
    socket.on('addTask', (taskTitle) => {
        // Se asigna un id basado en el máximo actual o 0 si no hay tareas
        const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 0;
        const newTask = {
            id: newId,
            title: taskTitle,
            votes: {}
        };
        tasks.push(newTask);
        // Notifica a todos los usuarios en la sala global
        io.to('global').emit('taskAdded', newTask);
        console.log(`Nueva tarea agregada: ${taskTitle}`);
    });

    socket.on('vote', ({ taskId, vote }) => {
        let task = tasks.find(t => t.id === taskId);
        if (task) {
            // Registrar el voto internamente
            task.votes[socket.userName] = vote;

            // Enviar confirmación privada al usuario que votó con su voto (si es necesario para mostrarlo en su pantalla)
            socket.emit('voteConfirmed', { taskId, vote });

            // Notificar a los demás que este usuario ha votado (sin el valor)
            socket.to('global').emit('userVoted', { user: socket.userName, taskId });

            // Verificar si todos han votado
            const clients = io.sockets.adapter.rooms.get('global');
            const numClients = clients ? clients.size : 0;
            if (Object.keys(task.votes).length >= numClients && numClients > 0) {
                io.to('global').emit('allVoted', taskId);
            }
        }
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
