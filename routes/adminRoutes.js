const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Admin Dashboard Analytics & Summary Stats
router.get('/stats', async (req, res) => {
    try {
        const [[{ total_workers }]] = await db.query('SELECT COUNT(*) AS total_workers FROM workers');
        const [[{ verified_workers }]] = await db.query('SELECT COUNT(*) AS verified_workers FROM workers WHERE is_verified = 1');
        const [[{ total_employers }]] = await db.query('SELECT COUNT(*) AS total_employers FROM employers');
        const [[{ total_jobs }]] = await db.query('SELECT COUNT(*) AS total_jobs FROM jobs');
        const [[{ pending_jobs }]] = await db.query("SELECT COUNT(*) AS pending_jobs FROM jobs WHERE status = 'pending'");
        const [[{ approved_jobs }]] = await db.query("SELECT COUNT(*) AS approved_jobs FROM jobs WHERE status = 'approved'");
        const [[{ total_reviews }]] = await db.query('SELECT COUNT(*) AS total_reviews FROM reviews');
        const [[{ open_reports }]] = await db.query("SELECT COUNT(*) AS open_reports FROM user_reports WHERE status = 'open'");
        const [[{ open_complaints }]] = await db.query("SELECT COUNT(*) AS open_complaints FROM complaints WHERE status = 'open'");

        // Block-wise worker distribution for Admin Analytics
        const [block_stats] = await db.query(`
            SELECT l.name AS block_name, COUNT(w.id) AS worker_count
            FROM localities l
            LEFT JOIN workers w ON l.id = w.locality_id
            GROUP BY l.id, l.name
            ORDER BY worker_count DESC
        `);

        res.json({
            success: true,
            data: {
                total_workers,
                verified_workers,
                total_employers,
                total_jobs,
                pending_jobs,
                approved_jobs,
                total_reviews,
                open_reports,
                open_complaints,
                block_stats
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching admin stats' });
    }
});

// 2. Add / Delete Categories
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

router.delete('/categories/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Category delete ho gayi!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Category delete nahi ho saki.' });
    }
});

// 3. Manage Advertisements (Get All, Create, Toggle, Delete)
router.get('/ads', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM advertisements ORDER BY id DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching ads' });
    }
});

router.post('/ads', async (req, res) => {
    try {
        const { title, subtitle, contact_phone, link_url } = req.body;
        if (!title) return res.status(400).json({ success: false, message: 'Ad title zaroori hai.' });

        await db.query(
            'INSERT INTO advertisements (title, subtitle, contact_phone, link_url, is_active) VALUES (?, ?, ?, ?, 1)',
            [title.trim(), (subtitle || '').trim(), (contact_phone || '').trim(), (link_url || '').trim()]
        );
        res.status(201).json({ success: true, message: 'Naya Advertisement live ho gaya!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error creating ad' });
    }
});

router.patch('/ads/:id/toggle', async (req, res) => {
    try {
        await db.query('UPDATE advertisements SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Ad status updated!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error updating ad' });
    }
});

router.delete('/ads/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM advertisements WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Advertisement delete ho gaya!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error deleting ad' });
    }
});

// 4. Manage Fake User Reports
router.get('/reports', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM user_reports ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching reports' });
    }
});

router.patch('/reports/:id/resolve', async (req, res) => {
    try {
        await db.query("UPDATE user_reports SET status = 'resolved' WHERE id = ?", [req.params.id]);
        res.json({ success: true, message: 'Report resolved mark kar di gayi!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error updating report' });
    }
});

// 5. Manage Complaints & Applications
router.get('/complaints', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM complaints ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching complaints' });
    }
});

router.patch('/complaints/:id/resolve', async (req, res) => {
    try {
        await db.query("UPDATE complaints SET status = 'resolved' WHERE id = ?", [req.params.id]);
        res.json({ success: true, message: 'Complaint resolved mark kar di gayi!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error updating complaint' });
    }
});

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