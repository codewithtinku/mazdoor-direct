const express = require('express');
const router = express.Router();
const db = require('../config/db'); // ya jo path workerRoutes.js me use ho raha hai

// Employer Registration
router.post('/register', async (req, res) => {
    try {
        const { name, phone, business_name, locality_id, address } = req.body;
        
        if (!name || !phone) {
            return res.status(400).json({ success: false, message: 'Name and phone are required' });
        }

        const [existing] = await db.query('SELECT id FROM employers WHERE phone = ?', [phone]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Phone number already registered' });
        }

        const [result] = await db.query(
            'INSERT INTO employers (name, phone, business_name, locality_id, address) VALUES (?, ?, ?, ?, ?)',
            [name, phone, business_name || null, locality_id || null, address || null]
        );

        res.status(201).json({
            success: true,
            message: 'Employer registered successfully',
            employerId: result.insertId
        });
    } catch (err) {
        console.error('Employer register error:', err);
        res.status(500).json({ success: false, message: 'Server error registering employer' });
    }
});

module.exports = router;