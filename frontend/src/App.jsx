import { useState, useEffect } from 'react';
import './App.css';
import TaskList from './components/TaskList';
import { getTasks, createTask, updateTask, deleteTask } from './api/calendarTasks';

function App() {
  // State management
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Check authentication and load tasks on mount
  useEffect(() => {
    checkAuth();
    
    // Check for auth callback from Google
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      window.history.replaceState({}, '', '/');
      checkAuth();
    }
  }, []);

  /**
   * Check if user is authenticated
   */
  const checkAuth = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/status', {
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
   * Handle Google login
   */
  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/google');
      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error('Login failed:', error);
      setError('Failed to start login process');
    }
  };

  /**
   * Sync with Google Calendar
   */
  const handleSync = async () => {
    try {
      setError(null);
      const response = await fetch('http://localhost:5000/api/sync', {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.synced > 0) {
        setError(`✅ Synced ${data.synced} new events from Google Calendar!`);
        loadTasks(); // Reload tasks
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
      setTasks(data);
    } catch (err) {
      console.error('Error loading tasks:', err);
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

    try {
      const newTask = await createTask({ title: newTaskTitle });
      setTasks([newTask, ...tasks]);
      setNewTaskTitle('');
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to add task');
    }
  };

  /**
   * Toggle task completion
   */
  const handleToggleComplete = async (taskId) => {
    try {
      const task = tasks.find(t => t._id === taskId);
      const updatedTask = await updateTask(taskId, { 
        completed: !task.completed 
      });
      setTasks(tasks.map(t => 
        t._id === taskId ? updatedTask : t
      ));
    } catch (err) {
      console.error('Error toggling task:', err);
      setError('Failed to update task');
    }
  };

  /**
   * Delete a task
   */
  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter(t => t._id !== taskId));
      if (activeTask?._id === taskId) {
        setActiveTask(null);
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task');
    }
  };

  /**
   * Select a task to work on with Pomodoro
   */
  const handleSelectTask = (task) => {
    setActiveTask(task);
  };

  /**
   * When a Pomodoro completes, increment the task's count
   */
  const handlePomodoroComplete = async () => {
    if (!activeTask) return;

    try {
      const updatedTask = await updateTask(activeTask._id, {
        pomodoroCount: activeTask.pomodoroCount + 1
      });
      setTasks(tasks.map(t => 
        t._id === activeTask._id ? updatedTask : t
      ));
      setActiveTask(updatedTask);
    } catch (err) {
      console.error('Error updating Pomodoro count:', err);
      setError('Failed to update Pomodoro count');
    }
  };

  // Show login screen if not authenticated
  if (!isAuthenticated && !loading) {
    return (
      <div className="app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          maxWidth: '400px'
        }}>
          <h1>🍅 FocusDesk</h1>
          <p style={{ color: '#666', margin: '20px 0' }}>
            Connect your Google Calendar to get started
          </p>
          <button 
            onClick={handleLogin}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#4285F4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="app loading">
        <div className="spinner"></div>
        <p>Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>🍅 FocusDesk</h1>
        <p>Task Manager</p>
        {user && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            marginTop: '10px',
            fontSize: '14px'
          }}>
            <span>👤 {user.email}</span>
            <button 
              onClick={handleSync}
              style={{
                padding: '6px 12px',
                backgroundColor: '#34A853',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              🔄 Sync Calendar
            </button>
          </div>
        )}
      </header>
      
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="main-content">
        {/* Left side: Task List */}
        <div className="task-section">
          <h2>Tasks</h2>
          
          {/* Add Task Form */}
          <form onSubmit={handleAddTask} className="add-task-form">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="What do you need to focus on?"
              className="task-input"
            />
            <button type="submit" className="add-button">
              Add Task
            </button>
          </form>

          {/* Task List */}
          <TaskList
            tasks={tasks}
            activeTask={activeTask}
            onSelectTask={handleSelectTask}
            onToggleComplete={handleToggleComplete}
            onDeleteTask={handleDeleteTask}
          />
        </div>
      </div>
    </div>
  );
}

export default App;