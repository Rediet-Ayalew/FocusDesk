const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'https://focusdesk0.netlify.app'

];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));


app.use(express.json());

const { MongoStore } = require('connect-mongo');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongoUrl: process.env.MONGODB_URI }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));



// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((error) => console.error("❌ Error:", error));

// Task Schema with deleted flag
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  duration: { type: Number, default: 0 },
  progress: {
    type: String,
    enum: ["Not Started", "In Progress", "Done"],
    default: "Not Started"
  },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  dueDate: { type: Date },
  pomodoroCount: { type: Number, default: 0 },
  googleEventId: { type: String },
  userId: { type: String, required: true },
  deleted: { type: Boolean, default: false } 
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  googleId: String,
  email: String,
  accessToken: String,
  refreshToken: String
});

const Task = mongoose.model('Task', taskSchema);
const User = mongoose.model('User', userSchema);

// OAuth Client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.BACKEND_URL}/api/auth/callback`
);

// Helper function
async function getCalendar(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('Not authenticated');
  
  oauth2Client.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken
  });
  
  return google.calendar({ version: 'v3', auth: oauth2Client });
}


// AUTH ROUTES

app.get('/api/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    prompt: 'consent'
  });
  res.json({ url });
});

app.get('/api/auth/callback', async (req, res) => {
  try {
    const { tokens } = await oauth2Client.getToken(req.query.code);
    oauth2Client.setCredentials(tokens);
    
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    
    let user = await User.findOne({ googleId: data.id });
    if (!user) {
      user = await User.create({
        googleId: data.id,
        email: data.email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token
      });
    } else {
      user.accessToken = tokens.access_token;
      if (tokens.refresh_token) user.refreshToken = tokens.refresh_token;
      await user.save();
    }
    
    req.session.userId = user._id;
    res.redirect(`${process.env.FRONTEND_URL}?auth=success`);
  } catch (error) {
    console.error('Auth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}?auth=failed`);
  }
});

app.get('/api/auth/status', async (req, res) => {
  if (!req.session.userId) return res.json({ authenticated: false });
  const user = await User.findById(req.session.userId);
  console.log('Auth status for userId:', req.session.userId, 'user found:', !!user, 'email:', user?.email);
  res.json({ authenticated: !!user, email: user?.email });
});


// TASK ROUTES

app.get('/api/tasks', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    // Only return non-deleted tasks
    const tasks = await Task.find({ 
      userId: req.session.userId,
      deleted: false 
    }).sort({ dueDate: 1, createdAt: -1 });
    console.log(`Returning ${tasks.length} tasks for user ${req.session.userId}:`, tasks.map(t => ({ id: t._id, title: t.title, progress: t.progress, userId: t.userId, deleted: t.deleted })));
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Debug endpoint to see all tasks (remove after debugging)
app.get('/api/debug/tasks', async (req, res) => {
  try {
    const tasks = await Task.find({}).sort({ createdAt: -1 }).limit(50);
    console.log('All tasks in DB:', tasks.map(t => ({ id: t._id, title: t.title, progress: t.progress, userId: t.userId, deleted: t.deleted, googleEventId: t.googleEventId })));
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    const task = await Task.create({
      ...req.body,
      userId: req.session.userId,
      deleted: false
    });
    console.log('Created new task:', { id: task._id, title: task.title, userId: task.userId });
    res.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    // If marking as Done (set completedAt)
    if (req.body.progress === 'Done' && !req.body.completedAt) {
      req.body.completedAt = new Date();
      req.body.completed = true;
    }
    
    // If changing from Done to other status (clear completedAt)
    if (req.body.progress && req.body.progress !== 'Done') {
      req.body.completed = false;
      req.body.completedAt = null;
    }
    
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.userId, deleted: false },
      req.body,
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    // Soft delete(mark as deleted instead of removing)
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.userId },
      { deleted: true },
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// SYNC ROUTE

app.post('/api/sync', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    const calendar = await getCalendar(req.session.userId);
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    const events = response.data.items || [];
    console.log(`Found ${events.length} calendar events for user ${req.session.userId}`);
    let synced = 0;
    
    for (const event of events) {
      if (!event.summary) continue;
      
      // Check if task exists (including deleted ones)
      const exists = await Task.findOne({
        userId: req.session.userId,
        googleEventId: event.id
      });
      
      // Only create if doesn't exist at all
      if (!exists) {
        await Task.create({
          title: event.summary,
          googleEventId: event.id,
          userId: req.session.userId,
          dueDate: event.start?.dateTime || event.start?.date,
          progress: "Not Started",
          deleted: false
        });
        synced++;
        console.log(`Synced new task: ${event.summary}`);
      } else {
        console.log(`Skipped existing task: ${event.summary}`);
      }
    }
    
    res.json({ synced, total: events.length });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});


// AUTO-SYNC (Every 5 minutes)

setInterval(async () => {
  console.log('Running auto-sync...');
  
  const users = await User.find();
  for (const user of users) {
    try {
      oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken
      });
      
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 50,
        singleEvents: true
      });
      
      for (const event of response.data.items || []) {
        if (!event.summary) continue;
        
        // Check if task exists (including deleted)
        const exists = await Task.findOne({
          userId: user._id,
          googleEventId: event.id
        });
        
        // Only create new tasks, don't restore deleted ones
        if (!exists) {
          await Task.create({
            title: event.summary,
            googleEventId: event.id,
            userId: user._id,
            dueDate: event.start?.dateTime || event.start?.date,
            progress: "Not Started",
            deleted: false
          });
        }
      }
      
      console.log(`Synced ${user.email}`);
    } catch (error) {
      console.error(`Sync failed for ${user.email}:`, error.message);
    }
  }
}, 5 * 60 * 1000);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});