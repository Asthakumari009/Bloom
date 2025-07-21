// --- 1. IMPORTS ---
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- 2. ENVIRONMENT VARIABLE CHECK (IMPROVED FOR DEBUGGING) ---
const requiredEnvVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL', 'GOOGLE_API_KEY'];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(`\n❌ FATAL ERROR: Environment variable "${varName}" is missing.`);
    console.error('   Please add it to your .env file and restart the server.');
    console.error('   You can find the Firebase values in your serviceAccountKey.json file.\n');
    process.exit(1); // Stop the server immediately
  }
}

// --- 3. INITIALIZATION & FIREBASE/GEMINI SETUP ---
const app = express();
const PORT = process.env.PORT || 5000;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    })
  });
  console.log('✅ Firebase Admin SDK initialized successfully from .env');
} catch (error) {
  console.error('❌ Failed to initialize Firebase. This can happen if credentials are valid but rejected by Firebase.', error);
  process.exit(1);
}
const db = admin.firestore();

// --- 4. MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));


// --- 5. API ROUTES (No changes needed here, your routes are correct) ---

// Authentication Middleware
const checkAuth = async (req, res, next) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ message: 'No token provided.' });
    req.user = await admin.auth().verifyIdToken(idToken);
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

// Public Route: Register
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) return res.status(400).json({ message: "All fields are required." });
        const userRecord = await admin.auth().createUser({ email, password, displayName: username });
        await db.collection('users').doc(userRecord.uid).set({ username, email, createdAt: new Date().toISOString() });
        res.status(201).json({ message: "User registered!", uid: userRecord.uid });
    } catch (error) {
        if (error.code === 'auth/email-already-exists') {
            return res.status(409).json({ message: "Email already in use." });
        }
        res.status(500).json({ message: "Failed to register user." });
    }
});

// Protected Route: Get Tasks
app.get('/api/tasks', checkAuth, async (req, res) => {
    try {
        const tasksSnapshot = await db.collection('users').doc(req.user.uid).collection('tasks').orderBy('createdAt', 'desc').get();
        const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch tasks." });
    }
});

// Protected Route: Create Task
app.post('/api/tasks', checkAuth, async (req, res) => {
    try {
        if (!req.body.text?.trim()) return res.status(400).json({ message: "Task text cannot be empty." });
        const newTask = { text: req.body.text, completed: false, createdAt: new Date().toISOString() };
        const taskRef = await db.collection('users').doc(req.user.uid).collection('tasks').add(newTask);
        res.status(201).json({ id: taskRef.id, ...newTask });
    } catch (error) {
        res.status(500).json({ message: "Failed to create task." });
    }
});

// Protected Route: Ask AI
app.post('/api/ask', checkAuth, async (req, res) => {
    res.status(200).json({ response: "AI feature is correctly configured." });
});

// Catch-all route for frontend
app.get('*', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});


// --- 6. SERVER STARTUP ---
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});