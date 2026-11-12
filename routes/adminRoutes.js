const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Admin Dashboard Summary Stats
router.get('/stats', async (req, res) => {
    try {
        const [[{ total_workers }]] = await db.query('SELECT COUNT(*) AS total_workers FROM workers');
        const [[{ total_employers }]] = await db.query('SELECT COUNT(*) AS total_employers FROM employers');
        const [[{ total_jobs }]] = await db.query('SELECT COUNT(*) AS total_jobs FROM jobs');
        const [[{ pending_jobs }]] = await db.query("SELECT COUNT(*) AS pending_jobs FROM jobs WHERE status = 'pending'");
        const [[{ approved_jobs }]] = await db.query("SELECT COUNT(*) AS approved_jobs FROM jobs WHERE status = 'approved'");
        const [[{ open_complaints }]] = await db.query("SELECT COUNT(*) AS open_complaints FROM complaints WHERE status = 'open'");

        res.json({
            success: true,
            data: {
                total_workers,
                total_employers,
                total_jobs,
                pending_jobs,
                approved_jobs,
                open_complaints
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching admin stats' });
    }
});

// 2. Add New Category (Admin)
router.post('/categories', async (req, res) => {
    try {
        const { group_name, name } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Category name zaroori hai.' });

        await db.query(
            'INSERT INTO categories (group_name, name) VALUES (?, ?)',
            [(group_name || 'Other Work').trim(), name.trim()]
        );
        res.status(201).json({ success: true, message: 'Nayi category add ho gayi!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error adding category' });
    }
});

// 3. Delete Category (Admin)
router.delete('/categories/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Category delete ho gayi!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Category delete nahi ho saki (shayed kisi worker/job se judi hai).' });
    }
});

// 4. Get All Complaints
router.get('/complaints', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM complaints ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching complaints' });
    }
});

// 5. Mark Complaint Resolved
router.patch('/complaints/:id/resolve', async (req, res) => {
    try {
        await db.query("UPDATE complaints SET status = 'resolved' WHERE id = ?", [req.params.id]);
        res.json({ success: true, message: 'Complaint resolved mark kar di gayi!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error updating complaint' });
    }
});

// 6. Get Job Applications (For Admin visibility)
router.get('/applications', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                ja.*,
                j.title AS job_title,
                j.employer_name,
                j.employer_phone
            FROM job_applications ja
            LEFT JOIN jobs j ON ja.job_id = j.id
            ORDER BY ja.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching applications' });
    }
});

module.exports = router;