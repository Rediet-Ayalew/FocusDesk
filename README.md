## 📘 Project Title
FocusDesk is a website that links your google calendar to a to-do list to keep daily track of your priorities.
---

## 🚀 Overview

Briefly describe:


**Example:**

A full stack To Do List called FocusDesk which is a productivity web application designed to help students stay organized by combining task management with Google Calendar integration. 

---

## 🌐 Live Demo

| Type                         | Link                                                           |
| ---------------------------- | -------------------------------------------------------------- |
| **Frontend (Deployed Site)** | [https://focusdesk0.netlify.app/](https://focusdesk0.netlify.app/) |
| **Backend (API Base URL)**   | [https://focusdesk-nrih.onrender.com](https://focusdesk-nrih.onrender.com)   |

> Test these in an incognito window before submission.
---

## ✨ Features

List **3–6 key features**, ideally with short bullets:

* Create, read, update, and delete from MongoDB
* Sync tasks directly from Google Calendar
* Full CRUD backend API with Express and MongoDB
* Google OAuth login with session-based authentication
* Advanced feature: Drag-and-drop task management with progress tracking
* Client and server-side error handling

### **Advanced Feature**
Google Calendar Integration:
The app integrates the Google Calendar API to sync a user’s calendar events into the task manager. After signing in with Google, events are fetched from the user’s calendar and automatically converted into tasks that can be organized and tracked within the app.

---

## 📸 Screenshots

Relative path- 
Screenshots/MainPage.png
Screenshots/signIn.png
---

## 🏗️ Project Architecture

Describe how the pieces fit together.

```
/frontend
  /public
   vite.svg
  /src
   /api
    /calendarTasks.js
   /assets
   App.css
   App.jsx
   index.css
   Main.jsx
 .env
 index.html
 package-lock.json
 package.json
/backend
  package-lock.json
  package.json
  server.js
.env
/Screenshots
  MainPage.png
  signIn.png
```

The React frontend sends requests to the Express backend through defined API routes, the backend handles authentication and task data while storing information in MongoDB, and environment variables in both the frontend and backend securely manage API URLs and sensitive credentials.

---

## 📦 Installation & Setup

### **1. Clone the project**

```bash
git clone https://github.com/Rediet-Ayalew/FocusDesk.git
cd FocusDesk
```

---

### **2. Environment Variables**

Include a `.env.example` file in both repos.

**Backend `.env.example`:**

```
MONGO_URI=your_mongodb_ur
PORT=5000


GOOGLE_CLIENT_ID= your google client id
GOOGLE_CLIENT_SECRET= your google client secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/callback
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

SESSION_SECRET= random string 
```

**Frontend `.env.example`:**

```
VITE_API_URL=https://focusdesk-nrih.onrender.com
```

---

### **3. Install Dependencies**

#### Frontend:

```bash
cd frontend
npm install
npm run dev
```

#### Backend:

```bash
cd backend
npm install
npm install connect-mongo@latest
npm run dev
```

---

### **4. Running Entire App Locally**

1. Start backend on `http://localhost:5000`
2. Start frontend on `http://localhost:5173`
3. Confirm CORS + API requests are working

---

## 🛠 API Documentation

Document the **main 3–5 routes**:


### **GET /api/tasks**
Returns all tasks for the authenticated user


### **POST /api/tasks**
Creates a new task.
Body example:


```json
{
  "title": "Finish homework",
  "dueDate": "2025-12-15",
  "progress": "Not Started"
}


```


### **PATCH /api/tasks/:id**
Updates an existing task (e.g., progress or due date).


### **DELETE /api/tasks/:id**
Deletes a tasks by userid.

### **GET /api/auth/google**
Start Google OAuth login

### **GET /api/auth/status**
Checks whether the user is authenticated via Google OAuth.

### **GET /api/auth/google/callback**
Google redirects here after login


### **GET /api/google**
Initiates Google authentication flow.

### **POST /api/auth/logout**
sign out user

### **POST /api/sync** 
sync events from Google Calendar into tasks

---

## 🚀 Deployment Notes

Document where/how you deployed:

### **Frontend**

*Deployed on Netlify
*Built using Vite + React
*Build command: npm run build
*Environment variables are configured in Netlify (VITE_API_URL) to connect to the backend



### **Backend**


* Deployed on Render
*Built with Node.js + Express
*Uses MongoDB for data persistence
*Environment variables (MongoDB URI, Google OAuth credentials, session secret) are securely configured in Render


---

## 🎥 Video Walkthrough

**Link to Loom/YouTube:**
[https://youtu.be/RyL_lwOYDkM](https://youtu.be/RyL_lwOYDkM)

Include quick timestamps if you want extra professionalism:

* **0:00–0:30** Overview
* **0:30–1:30** Core features demo
* **1:30–2:30** Advanced feature
* **2:30–3:00** Technical challenge solved

---

# 🧠 Reflection

*(This section is required for grading.)*


### **1. What was the hardest part of this project?**


The toughest part of building FocusDesk was definitely the deployment and debugging, especially hooking up the backend to the database and getting the Google Calendar API to sync tasks smoothly. I had to fix a bunch of stuff like environment variables, CORS settings, and session handling between Netlify and Render, plus test API calls and sort out MongoDB connections. In the end, it taught me a lot about making apps work in production, like using the right configs and adding good logging.


### **2. What are you most proud of?**

I am most proud of being able to sync google calendar API into my website. when you attempt to resync previous tasks it won't allow you so because it just imports tasks once and saves them in MongoDB for better organization and gives control to the user to add and delete tasks. 


### **3. What would you do differently next time?**


I would add signout button and add specific times for deadline instead of only dates. 


### **4. How did you incorporate feedback from the 12/5 check-in gallery?**


Be explicit (this is graded):


> “I wasn't there that day, but my friend has viewed my website while i was developing it. Her feedback was to make the UX design more attractive and organized. I was able to accomplish that. 
---

## note

For the site to function correctly, each person must set up their own Google Calendar API

# Acknowledgments / AI Usage Disclosure


> Include a brief note on tools used (per academic integrity guidelines):


* “Used ChatGPT to help troubleshoot a CORS issue.”
* “Used Chatgpt for help writing documentation.”
* “Used VSCode Copilot for autocomplete suggestions.”
* “Used VSCode Copilot, chatgpt, and Claude to debug deployment."
* “Used claude to help me debug the google auth code on server.js.”
* “Used Claude to fix my Schema.”
* “Used Claude to sync the google calendar task and fix up the code to drag and drop tasks from incomplete to done or in progress."

