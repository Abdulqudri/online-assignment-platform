
const AssignmentSubmission = require('../model/AssignmentSubmission'); // Your schema


const Course = require('../model/Course');
const Assignment = require('../model/Assignment');
const { scanFile } = require('../util/plagiarism');
require('dotenv').config();


// Controller functions
const plagiarismController = {
  // Fetch all assignments with filters
  async getFilteredAssignments(req, res) {
    try {
      const { studentName, plagiarismThreshold } = req.query;
      const userId = req.session.user.id; // Assuming session contains lecturer data

      // Find courses taught by the lecturer
      const courses = await Course.find({ lecturer: userId });

      if (courses.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No courses found for this lecturer.",
        });
      }

      const courseIds = courses.map((course) => course._id);

      // Find assignments related to the lecturer's courses
      const assignments = await Assignment.find({ course: { $in: courseIds } });

      if (assignments.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No assignments found for these courses.",
        });
      }

      const assignmentIds = assignments.map((assignment) => assignment._id);

      // Fetch all submissions for these assignments
      
      

      const filter = {};

      if (studentName) {
        filter['submittedBy.name'] = { $regex: studentName, $options: 'i' };
      }

      if (plagiarismThreshold) {
        filter.plagiarismScore = { $gt: Number(plagiarismThreshold) };
      }

      const submissions = await AssignmentSubmission.find({
        assignment: { $in: assignmentIds },
        
      })
        .populate("assignment", "title course")
        .populate("submittedBy", "name email userId") // Get student details
        .populate("course", "name"); // Get course details

        const notReviewedSubmissions = submissions.filter(
          (submission) => submission.status !== "Reviewed"
        );
          console.log(notReviewedSubmissions)
      res.status(200).json(notReviewedSubmissions);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      res.status(500).json({ message: 'Error fetching assignments' });
    }
  },

  // Run plagiarism check for an assignment
  async runPlagiarismCheck(req, res) {
    try {
        const { submissionId } = req.params;

        // Fetch the assignment submission from the database
        const submission = await AssignmentSubmission.findById(submissionId);

        if (!submission) {
            return res.status(404).json({ message: 'Assignment submission not found' });
        }
        
        await scanFile(submission)

        res.json({
            message: 'Plagiarism check submitted successfully. Results will be available soon.',
            data: submission.plagiarismScore
           
        });
    } catch (error) {
        console.error('Error running plagiarism check:', error);
        res.status(500).json({ message: 'Error running plagiarism check', error: error.message });
    }
},

  // Flag an assignment
  async flagAssignment(req, res) {
    try {
      const { submissionId } = req.params;

      const submission = await AssignmentSubmission.findByIdAndUpdate(
        submissionId,
        { flaged: true },
        { new: true }
      );

      if (!submission) {
        return res.status(404).json({ message: 'Assignment not found' });
      }

      res.json({ message: 'Assignment flagged', assignment: submission });
    } catch (error) {
      console.error('Error flagging assignment:', error);
      res.status(500).json({ message: 'Error flagging assignment' });
    }
  },

}

module.exports = plagiarismController;
