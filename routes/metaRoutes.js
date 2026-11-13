const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Get All Categories
router.get('/categories', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, group_name, name FROM categories ORDER BY id ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, message: 'Server error fetching categories' });
    }
});

// 2. Get All Localities (8 Koderma Blocks)
router.get('/localities', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, pincode, latitude, longitude FROM localities ORDER BY id ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching localities:', error);
        res.status(500).json({ success: false, message: 'Server error fetching localities' });
    }
});

// 3. Get Active Advertisements (For Home & Jobs Banner)
router.get('/ads', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM advertisements WHERE is_active = 1 ORDER BY id DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching ads:', error);
        res.status(500).json({ success: false, message: 'Server error fetching ads' });
    }
});

// 4. Report Fake Worker / Fake Job
router.post('/reports', async (req, res) => {
    try {
        const { target_type, target_id, target_name, reporter_phone, reason } = req.body;
        if (!target_id || !reporter_phone || !reason) {
            return res.status(400).json({ success: false, message: 'Mobile number aur report ka karan likhna zaroori hai.' });
        }

        await db.query(
            'INSERT INTO user_reports (target_type, target_id, target_name, reporter_phone, reason) VALUES (?, ?, ?, ?, ?)',
            [target_type || 'worker', target_id, target_name || '', reporter_phone.trim(), reason.trim()]
        );

        res.status(201).json({ success: true, message: 'Aapki report darj ho gayi hai! Admin jald hi iski jaanch karega.' });
    } catch (error) {
        console.error('Report error:', error);
        res.status(500).json({ success: false, message: 'Server error submitting report' });
    }
});

// 5. Submit Contact / Complaint Form
router.post('/complaints', async (req, res) => {
    try {
        const { sender_name, phone_number, subject, message } = req.body;
        if (!sender_name || !phone_number || !message) {
            return res.status(400).json({ success: false, message: 'Naam, mobile aur message zaroori hai.' });
        }
        await db.query(
            'INSERT INTO complaints (sender_name, phone_number, subject, message) VALUES (?, ?, ?, ?)',
            [sender_name.trim(), phone_number.trim(), subject || 'General Query', message.trim()]
        );
        res.status(201).json({ success: true, message: 'Aapka sandesh/shikayat darj ho gaya hai!' });
    } catch (error) {
        console.error('Complaint error:', error);
        res.status(500).json({ success: false, message: 'Server error submitting complaint' });
    }
});

module.exports = router;