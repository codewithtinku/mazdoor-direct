const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');

// 1. Get all workers (Home directory list)
router.get('/', workerController.getWorkers);

// 2. Specific worker profile by ID
router.get('/:id/profile', workerController.getWorkerProfile);

// 3. Register worker (Dono routes support karein taaki 404 na aaye)
router.post('/register', workerController.upload.single('profile_photo'), workerController.registerWorker);
router.post('/', workerController.upload.single('profile_photo'), workerController.registerWorker);

// 4. Admin Toggle Verification & Delete
router.patch('/:id/verify', workerController.toggleVerify);
router.delete('/:id', workerController.deleteWorker);

// 5. Submit Review
router.post('/:id/reviews', workerController.addReview);

module.exports = router;