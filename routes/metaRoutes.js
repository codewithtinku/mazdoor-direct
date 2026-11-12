const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Get All Categories (Grouped & Ordered)
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

// 3. Submit Contact / Complaint Form
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