const express = require('express');
const router = express.Router();
const { createAssignment, submitAssignment, assignments, getUserSubmissions, getSubmittedAssignments, giveFeedback, reviewedAssignment, getAnalyticsData } = require('../controller/assignmentController');
const upload = require("../middleware/fileUpload")

// Create Assignment route
router.post('/create-assignment', upload.single('file'), createAssignment);
router.post('/upload-assignment/:id', upload.single('file_upload'), submitAssignment);
router.post('/give-feedback/:id', giveFeedback)
router.get('/get-user-submissions', getUserSubmissions)
router.get('/assignments', assignments);
router.get('/submitted-assignments', getSubmittedAssignments);
router.get('/reviewed-assignments', reviewedAssignment);
router.get('/analytics-data', getAnalyticsData);


module.exports = router;
