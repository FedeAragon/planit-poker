import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './App.css'; // Puedes mover los estilos a un archivo CSS

const socket = io('https://backend-qqht.onrender.com');

function App() {
  const [userName, setUserName] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [selectedVote, setSelectedVote] = useState(null);
  const [allVoted, setAllVoted] = useState(false);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // La "tarea actual" es la primera en el array
  const currentTask = tasks.length > 0 ? tasks[0] : null;

  useEffect(() => {
    // Cuando el usuario recibe confirmación de su voto:
    socket.on('voteConfirmed', ({ taskId, vote }) => {
      // Actualiza solo el estado local del voto (ya lo estabas haciendo en handleVote)
      setSelectedVote(vote);
    });

    // Para indicar que otro usuario ya votó (sin el valor)
    socket.on('userVoted', ({ user, taskId }) => {
      // Aquí podrías, por ejemplo, agregar a un estado que almacene qué usuarios han votado
      // Sin embargo, si ya tienes una lista de votos en currentTask, asegúrate de no revelar el valor.
      // Por ejemplo, podrías mostrar un mensaje "UsuarioX ha votado" sin el valor.
      console.log(`El usuario ${user} ha votado en la tarea ${taskId}`);
    });

    socket.on('taskUpdated', (updatedTask) => {
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === updatedTask.id ? updatedTask : task
        )
      );
    });

    socket.on('revealVotes', (task) => {
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === task.id ? task : t
        )
      );
    });

    socket.on('loadTasks', (loadedTasks) => {
      setTasks(loadedTasks);
    });

    socket.on('allVoted', (taskId) => {
      if (currentTask && currentTask.id === taskId) {
        setAllVoted(true);
      }
    });

    socket.on('taskRemoved', (removedTaskId) => {
      setTasks(prevTasks => prevTasks.filter(task => task.id !== removedTaskId));
      setSelectedVote(null);
      setAllVoted(false);
    });

    socket.on('taskAdded', (newTask) => {
      setTasks(prevTasks => [...prevTasks, newTask]);
    });

    return () => {
      socket.off('taskUpdated');
      socket.off('revealVotes');
      socket.off('loadTasks');
      socket.off('allVoted');
      socket.off('taskRemoved');
      socket.off('taskAdded');
      socket.off('voteConfirmed');
      socket.off('userVoted');
    };
  }, [currentTask]);

  const handleLogin = () => {
    if (userName.trim() !== '') {
      socket.emit('join', userName);
      setLoggedIn(true);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await axios.post('https://backend-qqht.onrender.com/upload-csv', formData);
        setTasks(response.data.tasks);
      } catch (error) {
        console.error('Error al subir el CSV', error);
      }
    }
  };

  const handleVote = (vote) => {
    if (currentTask) {
      socket.emit('vote', { taskId: currentTask.id, vote });
      setSelectedVote(vote);
    }
  };

  const removeCurrentTask = () => {
    if (currentTask) {
      socket.emit('removeTask', currentTask.id);
    }
  };

  const addNewTask = () => {
    if (newTaskTitle.trim() !== '') {
      socket.emit('addTask', newTaskTitle);
      setNewTaskTitle('');
      setShowAddTaskForm(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Planning Poker</h1>
      </header>
      <div className="app-container">
        {!loggedIn ? (
          <div className="login-container">
            <h2>Ingresa tu nombre para participar</h2>
            <input
              type="text"
              placeholder="Tu nombre"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              className="input-field"
            />
            <button onClick={handleLogin} className="primary-button">Entrar</button>
          </div>
        ) : (
          <div className="main-content">
            {tasks.length === 0 && (
              <div className="upload-container">
                <h2>Subir Tareas (CSV)</h2>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="file-input" />
                <hr />
              </div>
            )}
            <div className="add-task-container">
              {!showAddTaskForm ? (
                <button onClick={() => setShowAddTaskForm(true)} className="secondary-button">
                  Agregar nueva tarea
                </button>
              ) : (
                <div className="add-task-form">
                  <input
                    type="text"
                    placeholder="Título de la nueva tarea"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    className="input-field"
                  />
                  <button onClick={addNewTask} className="primary-button">Agregar</button>
                  <button onClick={() => setShowAddTaskForm(false)} className="cancel-button">Cancelar</button>
                </div>
              )}
            </div>
            {currentTask ? (
              <div className="task-card">
                <h3>Tarea actual: {currentTask.title}</h3>
                <div className="vote-buttons">
                  {[1, 2, 3, 5, 8].map(num => (
                    <button
                      key={num}
                      onClick={() => handleVote(num)}
                      className={`vote-button ${selectedVote === num ? 'selected' : ''}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                {selectedVote && <p className="your-vote">Tu voto: <strong>{selectedVote}</strong></p>}
                {Object.keys(currentTask.votes).length > 0 && (
                  <div className="votes-container">
                    <h4>Votos:</h4>
                    {Object.entries(currentTask.votes).map(([user, vote]) => (
                      <div key={user} className="vote-entry">
                        {user}: {vote}
                      </div>
                    ))}
                  </div>
                )}
                <div className="buttons-container">
                  <button onClick={() => socket.emit('reveal', currentTask.id)} className="secondary-button">
                    Revelar Votos
                  </button>
                  <button
                    onClick={removeCurrentTask}
                    disabled={!allVoted}
                    className="next-task-button"
                  >
                    Siguiente Tarea
                  </button>
                </div>
              </div>
            ) : (
              <p className="no-tasks">No hay tareas restantes</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
