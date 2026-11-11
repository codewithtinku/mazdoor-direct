const express = require('express');
const router = express.Router();
const db = require('../config/db');// ya '../config/db'

// Admin Middleware (Simple password / secret key check)
const adminAuth = (req, res, next) => {
  const secret = req.headers['x-admin-key'] || req.query.key;
  if (!secret || secret !== (process.env.ADMIN_SECRET_KEY || 'admin123')) {
    return res.status(401).json({ success: false, message: 'Unauthorized access' });
  }
  next();
};

// 1. Get All Workers (Pending & Verified)
router.get('/workers', adminAuth, async (req, res) => {
  try {
    const query = `
      SELECT w.*, c.name AS category_name, l.name AS locality_name
      FROM workers w
      LEFT JOIN categories c ON w.category_id = c.id
      LEFT JOIN localities l ON w.locality_id = l.id
      ORDER BY w.created_at DESC
    `;
    const [workers] = await db.query(query);
    res.json({ success: true, data: workers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching workers' });
  }
});

// 2. Verify / Approve Worker
router.put('/workers/:id/verify', adminAuth, async (req, res) => {
  try {
    await db.query('UPDATE workers SET is_verified = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Worker verified successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating worker' });
  }
});

// 3. Delete Worker
router.delete('/workers/:id', adminAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM workers WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Worker deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting worker' });
  }
});

// 4. Get Dashboard Stats (Totals)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [[{ total_workers }]] = await db.query('SELECT COUNT(*) AS total_workers FROM workers');
    const [[{ total_employers }]] = await db.query('SELECT COUNT(*) AS total_employers FROM employers');
    const [[{ total_jobs }]] = await db.query('SELECT COUNT(*) AS total_jobs FROM jobs');
    
    res.json({
      success: true,
      data: { total_workers, total_employers, total_jobs }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
});

module.exports = router;