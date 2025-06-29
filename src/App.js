import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [filter, setFilter] = useState('all');

  const handleSuccess = (credentialResponse) => {
    const token = credentialResponse.credential;
    const decoded = jwtDecode(token);
    setUser(decoded);
  };

  const handleError = () => console.log('❌ Login Failed');

  const fetchTasks = async () => {
    if (!user?.email) return;
    try {
      const res = await axios.get(`http://localhost:5000/tasks/${user.email}`);
      setTasks(res.data);
    } catch (err) {
      console.error('❌ Failed to fetch tasks:', err);
    }
  };

  const addTask = async () => {
    if (!title.trim()) return;
    try {
      await axios.post('http://localhost:5000/tasks', {
        title,
        status: 'incomplete',
        owner: user.email,
        sharedWith: [],
      });
      setTitle('');
      fetchTasks();
    } catch (err) {
      console.error('❌ Failed to add task:', err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/tasks/${id}`);
      fetchTasks();
    } catch (err) {
      console.error('❌ Failed to delete task:', err);
    }
  };

  const toggleComplete = async (task) => {
    try {
      await axios.put(`http://localhost:5000/tasks/${task._id}`, {
        ...task,
        status: task.status === 'complete' ? 'incomplete' : 'complete',
      });
      fetchTasks();
    } catch (err) {
      console.error('❌ Failed to update task:', err);
    }
  };

  const logout = () => {
    setUser(null);
    setTasks([]);
    setTitle('');
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.status === 'complete';
    if (filter === 'pending') return task.status === 'incomplete';
    return true;
  });

  useEffect(() => {
    if (user) fetchTasks();
  }, [user]);

  return (
    <GoogleOAuthProvider clientId="774206678672-10l306vftpo159jqq90489buovne94si.apps.googleusercontent.com">
      <div className="app">
        <h1 className="title">📝 Todo Task Manager</h1>

        {!user ? (
          <div className="google-login-wrapper">
            <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
          </div>
        ) : (
          <div className="card">
            <div className="user-info">
              <img src={user.picture} alt="profile" className="avatar" />
              <div>
                <h2>{user.name}</h2>
                <p>{user.email}</p>
              </div>
              <button className="logout" onClick={logout}>Logout</button>
            </div>

            <div className="task-input">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="✍️ Write your task..."
              />
              <button onClick={addTask}>Add</button>
            </div>

            <div className="filters">
              <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>All</button>
              <button onClick={() => setFilter('completed')} className={filter === 'completed' ? 'active' : ''}>Completed</button>
              <button onClick={() => setFilter('pending')} className={filter === 'pending' ? 'active' : ''}>Pending</button>
            </div>

            <ul className="task-list">
              {filteredTasks.map((task) => (
                <li key={task._id} className={`task-item ${task.status === 'complete' ? 'done' : ''}`}>
                  <label>
                    <input
                      type="checkbox"
                      checked={task.status === 'complete'}
                      onChange={() => toggleComplete(task)}
                    />
                    <span>{task.title}</span>
                  </label>
                  <button className="delete-btn" onClick={() => deleteTask(task._id)}>🗑️</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
