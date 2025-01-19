const express = require('express');
const plagiarismController = require('../controllers/plagiarismController');

const router = express.Router();

// Routes
router.get('/assignments/filter', plagiarismController.getFilteredAssignments);
router.post('/assignments/:submissionId/plagiarism-check', plagiarismController.runPlagiarismCheck);
router.post('/assignments/:submissionId/flag', plagiarismController.flagAssignment);


module.exports = router;
