const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Post a new Job
router.post('/create', async (req, res) => {
    try {
        const { employer_id, category_id, locality_id, title, description, wage_offered, wage_type, workers_needed } = req.body;

        if (!employer_id || !category_id || !locality_id || !title) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        const [result] = await db.query(
            `INSERT INTO jobs (employer_id, category_id, locality_id, title, description, wage_offered, wage_type, workers_needed)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [employer_id, category_id, locality_id, title, description || '', wage_offered || null, wage_type || 'daily', workers_needed || 1]
        );

        res.status(201).json({ success: true, message: 'Job posted successfully', jobId: result.insertId });
    } catch (err) {
        console.error('Job creation error:', err);
        res.status(500).json({ success: false, message: 'Failed to post job' });
    }
});

// 2. Search & List Jobs with Filters
router.get('/search', async (req, res) => {
    try {
        const { category_id, locality_id } = req.query;
        let query = `
            SELECT j.*, 
                   c.name AS category_name, 
                   l.name AS locality_name, 
                   e.name AS employer_name, 
                   e.phone AS employer_phone
            FROM jobs j
            JOIN categories c ON j.category_id = c.id
            JOIN localities l ON j.locality_id = l.id
            JOIN employers e ON j.employer_id = e.id
            WHERE j.status = 'open'
        `;
        const params = [];

        if (category_id) {
            query += ' AND j.category_id = ?';
            params.push(category_id);
        }
        if (locality_id) {
            query += ' AND j.locality_id = ?';
            params.push(locality_id);
        }

        query += ' ORDER BY j.created_at DESC';

        const [jobs] = await db.query(query, params);
        res.json({ success: true, data: jobs });
    } catch (err) {
        console.error('Job search error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
    }
});

module.exports = router;