require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Body Parser Middlewares (Sabse pehle zaroori hain)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// 3. Admin Login Route (Body parsers ke baad)
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body || {};
    const adminPass = process.env.ADMIN_SECRET_KEY || 'admin123';

    if (password && password === adminPass) {
        return res.json({ success: true, message: 'Login successful' });
    }
    return res.status(401).json({ success: false, message: 'Galat password! Dobara koshish karein.' });
});

// 4. Modular Routes
const metaRoutes = require('./routes/metaRoutes');
const workerRoutes = require('./routes/workerRoutes');

app.use('/api', metaRoutes);
app.use('/api/workers', workerRoutes);

// Fallback for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});