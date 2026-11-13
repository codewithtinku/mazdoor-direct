const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');

// 1. Get All Workers
router.get('/', workerController.getWorkers);

// 2. Get Single Worker Full Profile (With Portfolio & Detailed Reviews)
router.get('/:id', workerController.getWorkerProfile);

// 3. Register Worker
router.post('/register', workerController.upload.single('profile_photo'), workerController.registerWorker);

// 4. Upload Completed Work Photo to Worker Portfolio
router.post('/:id/portfolio', workerController.upload.single('work_photo'), workerController.addPortfolio);

// 5. Delete Portfolio Post
router.delete('/portfolio/:portfolioId', workerController.deletePortfolio);

// 6. Toggle Verification Status (Admin)
router.patch('/:id/verify', workerController.toggleVerify);

// 7. Delete Worker (Admin)
router.delete('/:id', workerController.deleteWorker);

// 8. Submit Detailed 5-Star Rating & Review
router.post('/:id/reviews', workerController.addReview);

module.exports = router;