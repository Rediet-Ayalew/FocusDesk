const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';


export const getTasks = async () => {
  const response = await fetch(`${API_URL}/api/tasks`, {
    credentials: 'include'  // needed to ask credentials before accessing the website to connect the website to a google account
  });
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
};

export const createTask = async (taskData) => {
  const response = await fetch(`${API_URL}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  
    body: JSON.stringify(taskData)
  });
  if (!response.ok) throw new Error('Failed to create task');
  return response.json();
};

export const updateTask = async (taskId, updates) => {
  const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  
    body: JSON.stringify(updates)
  });
  if (!response.ok) throw new Error('Failed to update task');
  return response.json();
};

export const deleteTask = async (taskId) => {
  const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
    method: 'DELETE',
    credentials: 'include' 
  });
  if (!response.ok) throw new Error('Failed to delete task');
  return response.json();
};