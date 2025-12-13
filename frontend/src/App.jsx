import { useState, useEffect } from 'react';
import './App.css';
import { getTasks, createTask, updateTask, deleteTask } from './api/calendarTasks';
const API_URL = import.meta.env.VITE_API_URL;


function App() {
  // State management
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);

  // Check authentication and load tasks on mount
  useEffect(() => {
    checkAuth();
    
    // this checks auth callback from Google
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      window.history.replaceState({}, '', '/');
      checkAuth();
    }
  }, []);

  /**
   * Check whether a user is authenticated or not
   */
  const checkAuth = async () => {
    try {
      const response = await fetch('${API_URL}/api/auth/status', {
        credentials: 'include'
      });
      const data = await response.json();
      
      setIsAuthenticated(data.authenticated);
      setUser(data);
      
      if (data.authenticated) {
        loadTasks();
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setLoading(false);
    }
  };

  /**
   * Google login
   */

const handleLogin = async () => {
  try {
    const response = await fetch(`${API_URL}/api/auth/google`, {
      credentials: 'include'
    });
    const data = await response.json();
    window.location.href = data.url;
  } catch (error) {
    console.error('Login failed:', error);
    setError('Failed to start login process');
  }
};

  /**
   * this allows Sync with the Google Calendar
   */
  const handleSync = async () => {
    try {
      setError(null);
      const response = await fetch('${API_URL}/api/sync', {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.synced > 0) {
        setError(`✅ Synced ${data.synced} new events from Google Calendar!`);
        loadTasks(); 
      } else {
        setError('✅ Calendar is up to date!');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setError('Failed to sync calendar');
    }
  };

  /**
   * Fetch all tasks from backend
   */
  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTasks();
        console.log('Loaded tasks from API:', data);
        console.log('Number of tasks:', data?.length);
      setTasks(data);
        console.log('Tasks state after setTasks:', data);
    } catch (err) {
      console.error('Error loading tasks:', err);
        console.error('Full error object:', err);
      setError('Failed to load tasks. Make sure your backend is running.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add a new task
   */
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    console.log('Adding task:', newTaskTitle, 'due:', newTaskDueDate);
    try {
      const newTask = await createTask({
        title: newTaskTitle,
        dueDate: newTaskDueDate || undefined,
        progress: 'Not Started'
      });
      console.log('Task created:', newTask);
      setTasks([newTask, ...tasks]);
      setNewTaskTitle('');
      setNewTaskDueDate('');
    } catch (err) {
      console.error('Failed to add task:', err);
      setError('Failed to add task');
    }
  };

  /**
   * Delete a task
   */
  const handleDeleteTask = async (taskId) => {
    try {
      await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (err) {
      setError('Failed to delete task');
    }
  };


  const updateTaskProgress = async (taskId, newProgress) => {
    try {
      const updatedTask = await updateTask(taskId, { progress: newProgress });
      setTasks(tasks.map(t => t._id === taskId ? updatedTask : t));
    } catch (err) {
      setError('Failed to update task');
      loadTasks();
    }
  };

  const handleDragStart = (task) => {
    console.log('Drag start:', task.title);
    setDraggedTask(task);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (newProgress) => {
    console.log('Drop to progress:', newProgress, 'dragged task:', draggedTask?.title);
    if (draggedTask && draggedTask.progress !== newProgress) {
      updateTaskProgress(draggedTask._id, newProgress);
    }
    setDraggedTask(null);
  };

  const getTasksByProgress = (progress) => {
    const filtered = tasks.filter(t => t.progress === progress);
    console.log(`Tasks with progress "${progress}":`, filtered.length, filtered);
    return filtered;
  };

  const formatDueDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)} days overdue`;
    if (diff <= 7) return `In ${diff} days`;
    
    return d.toLocaleDateString();
  };

  // this shows login screen if not authenticated
  if (!isAuthenticated && !loading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>🍅 FocusDesk</h1>
          <p className="login-subtitle">Connect your Google Calendar to get started</p>
          <button onClick={handleLogin} className="login-button">
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1 className="title">🍅 FocusDesk</h1>
          <p className="subtitle">Organized Task Manager</p>
        </div>
        {user && (
          <div className="user-section">
            <span className="user-email">👤 {user.email}</span>
            <button onClick={handleSync} className="sync-button">
              🔄 Sync Calendar
            </button>
          </div>
        )}
      </header>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)} className="dismiss-button">×</button>
        </div>
      )}

      <div className="container">
        <div className="add-form">
          <input
            type="text"
            id="task-title-input"
            name="title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            placeholder="What do you need to focus on?"
            className="task-input"
          />
          <label htmlFor="due-date-input" style={{ marginRight: '8px' }}>Due Date:</label>
          <input
            id="due-date-input"
            name="dueDate"
            type="date"
            value={newTaskDueDate}
            onChange={(e) => setNewTaskDueDate(e.target.value)}
            className="date-input"
          />
          <button onClick={handleAddTask} className="add-button">
            + Add Task
          </button>
        </div>

        <div className="columns-container">
          <div
            className={`column ${draggedTask ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop('Not Started')}
          >
            <h2 className="column-title" style={{color: '#6B7280'}}>
              📋 Not Started ({getTasksByProgress('Not Started').length})
            </h2>
            <div className="task-list">
              {getTasksByProgress('Not Started').map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onDragStart={handleDragStart}
                  onDelete={handleDeleteTask}
                  formatDueDate={formatDueDate}
                  color="#6B7280"
                />
              ))}
            </div>
          </div>

          <div
            className={`column ${draggedTask ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop('In Progress')}
          >
            <h2 className="column-title" style={{color: '#F59E0B'}}>
              ⚡ In Progress ({getTasksByProgress('In Progress').length})
            </h2>
            <div className="task-list">
              {getTasksByProgress('In Progress').map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onDragStart={handleDragStart}
                  onDelete={handleDeleteTask}
                  formatDueDate={formatDueDate}
                  color="#F59E0B"
                />
              ))}
            </div>
          </div>

          <div
            className={`column ${draggedTask ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop('Done')}
          >
            <h2 className="column-title" style={{color: '#10B981'}}>
              ✅ Done ({getTasksByProgress('Done').length})
            </h2>
            <div className="task-list">
              {getTasksByProgress('Done').map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onDragStart={handleDragStart}
                  onDelete={handleDeleteTask}
                  formatDueDate={formatDueDate}
                  color="#10B981"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, onDragStart, onDelete, formatDueDate, color }) {
  const dueText = formatDueDate(task.dueDate);
  const isOverdue = dueText && dueText.includes('overdue');

  return (
    <div
      draggable
      onDragStart={() => onDragStart(task)}
      className="task-card"
      style={{borderLeft: `4px solid ${color}`}}
    >
      <div className="task-content">
        <p className="task-title">{task.title}</p>
        {dueText && (
          <span 
            className="due-date"
            style={{
              color: isOverdue ? '#EF4444' : '#6B7280',
              fontWeight: isOverdue ? '600' : '400'
            }}
          >
            📅 {dueText}
          </span>
        )}
      </div>
      <button
        onClick={() => onDelete(task._id)}
        className="delete-button"
      >
        🗑️
      </button>
    </div>
  );
}

export default App;