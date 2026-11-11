require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// 1. Initialize Express App
const app = express();
const PORT = process.env.PORT || 3000;

// 2. Body Parser & Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Serve Static Files & Uploads
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. Import Route Handlers
const employerRoutes = require('./routes/employerRoutes');
const jobRoutes = require('./routes/jobRoutes');
const adminRoutes = require('./routes/adminRoutes');
const metaRoutes = require('./routes/metaRoutes');
const workerRoutes = require('./routes/workerRoutes');

// 5. Mount API Routes
app.use('/api/employers', employerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api', metaRoutes);

// 6. Admin Login Route
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body || {};
    const adminPass = process.env.ADMIN_SECRET_KEY || 'admin123';

    if (password && password === adminPass) {
        return res.json({ success: true, message: 'Login successful' });
    }
    return res.status(401).json({ success: false, message: 'Galat password! Dobara koshish karein.' });
});

// 7. Fallback for Root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 8. Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});