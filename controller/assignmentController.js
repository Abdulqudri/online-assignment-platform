const Assignment = require("../model/Assignment");
const AssignmentSubmission = require("../model/AssignmentSubmission");
const Course = require("../model/Course");
const User = require("../model/User");

const assignmentController = {
  // Create Assignment (For Lecturers)
  createAssignment: async (req, res) => {
    try {
      const { title, description, dueDate, course, extraTime } = req.body;

      // Validate input
      if (!title || !description || !dueDate || !course) {
        return res
          .status(400)
          .json({ success: false, message: "All fields are required" });
      }

      // Check if course exists
      const foundCourse = await Course.findById(course);
      if (!foundCourse) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }

      // Get users registered for the course
      const users = await User.find({ courses: course });

      // Parse due date
      const dueDateTime = new Date(dueDate);

      // Handle file upload
      let filePath = null;
      if (req.file) {
        filePath = `/uploads/${req.file.filename}`;
      }

      // Create assignment
      const newAssignment = new Assignment({
        title,
        description,
        dueDate: dueDateTime,
        course: foundCourse._id,
        extraTime: parseInt(extraTime, 10),
        filePath,
        userIds: users.map((user) => user._id),
        status: "Pending",
      });

      await newAssignment.save();

      res.status(201).json({
        success: true,
        message: "Assignment created successfully",
        assignment: newAssignment,
      });
    } catch (error) {
      console.error("Error creating assignment:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Internal server error",
          error: error.message,
        });
    }
  },

  // Submit Assignment (For Students)
  submitAssignment: async (req, res) => {
    try {
      const { title, comments, plagiarism_check } = req.body;
      let filePath = null;
      if (req.file) {
        filePath = `/uploads/${req.file.filename}`;
      }
      const userId = req.session.user.id; // Assuming session contains user data
      const assignment_id = req.params.id;

      // Validate input
      if (!title) {
        return res
          .status(400)
          .json({ success: false, message: "Title and file are required." });
      }

      // Fetch the user and validate session
      const user = await User.findById(userId).populate("courses");
      if (!user) {
        return res
          .status(401)
          .json({
            success: false,
            message: "User not found or not logged in.",
          });
      }

      // Fetch the assignment
      const assignment = await Assignment.findById(assignment_id).populate(
        "course"
      );
      if (!assignment) {
        return res
          .status(404)
          .json({ success: false, message: "Assignment not found." });
      }

      // Verify the assignment belongs to a course the user is enrolled in
      if (
        !user.courses.some((course) => course._id.equals(assignment.course._id))
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message: "User not enrolled in this course.",
          });
      }

      // Check if the user already submitted for this assignment
      const existingSubmission = await AssignmentSubmission.findOne({
        assignment: assignment._id,
        submittedBy: userId,
      });
      if (existingSubmission) {
        return res
          .status(400)
          .json({ success: false, message: "Assignment already submitted." });
      }

      // Create a new submission
      const submission = new AssignmentSubmission({
        assignment: assignment._id,
        title,
        course: assignment.course._id, // Associate the course from the assignment
        filePath,
        comments: comments || null,
        plagiarismCheck: !!plagiarism_check,
        submittedBy: userId,
      });

      // Update the assignment status to "submitted"
      assignment.status = "Submitted";
      await assignment.save();

      // Save the submission
      await submission.save();

      res.status(201).json({
        success: true,
        message: "Assignment submitted successfully.",
        submission,
      });
    } catch (error) {
      console.error("Error submitting assignment:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Internal server error.",
          error: error.message,
        });
    }
  },

  // Get Submissions for a User (For Students)
  getUserSubmissions: async (req, res) => {
    try {
      const userId = req.session.user.id;

      // Fetch submissions made by the user
      const submissions = await AssignmentSubmission.find({
        submittedBy: userId,
      })
        .populate("assignment", "title description dueDate")
        .populate("course", "name");

      if (!submissions.length) {
        return res.status(200).json({
          success: true,
          message: "No submissions found for the user.",
          data: [], // Return an empty array to indicate no records
        });
      }

      res.status(200).json({
        success: true,
        message: "Submissions retrieved successfully.",
        data: submissions,
      });
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error.",
        error: error.message,
      });
    }
  },
  // Get All Assignments for a User (For Students)
  assignments: async (req, res) => {
    try {
      const userId = req.session.user.id;

      // Fetch the student's data with courses
      const student = await User.findById(userId).populate(
        "courses",
        "_id name"
      );

      // Filter only active courses if needed
      const activeCourseIds = student.courses.map((course) => course._id);

      // Fetch assignments associated with the user's active courses
      const assignments = await Assignment.find({
        course: { $in: activeCourseIds },
      }).populate("course", "name");

      // Set assignment_id in session if needed
      req.session.assignment_id = assignments.map(
        (assignment) => assignment._id
      ); // Ensure to store array of IDs

      res.status(200).json({ success: true, data: assignments });
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch assignments" });
    }
  },
  getSubmittedAssignments: async (req, res) => {
    try {
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
      const submissions = await AssignmentSubmission.find({
        assignment: { $in: assignmentIds },
      })
        .populate("assignment", "title course")
        .populate("submittedBy", "name email") // Get student details
        .populate("course", "name"); // Get course details

      // Separate reviewed and not-reviewed submissions
      const reviewedSubmissions = submissions.filter(
        (submission) => submission.status === "Reviewed"
      );
      const notReviewedSubmissions = submissions.filter(
        (submission) => submission.status !== "Reviewed"
      );

      res.status(200).json({
        success: true,
        data: {
          reviewedSubmissions,
          notReviewedSubmissions,
        },
      });
    } catch (error) {
      console.error("Error fetching submitted assignments:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error.",
        error: error.message,
      });
    }
  },
  giveFeedback: async (req, res) => {
    const submissionId = req.params.id; // Get submission ID from URL parameters
    const { feedback, score } = req.body; // Extract feedback and score from the form

    try {
      // Find the corresponding submission
      const submission = await AssignmentSubmission.findById(submissionId)
        .populate("assignment course submittedBy") // Populate related fields
        .exec();

      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      // Check if the user is authorized to provide feedback
      const user = req.session.user;
      if (user.role !== "lecturer") {
        return res.status(403).json({ message: "Unauthorized access" });
      }

      // Update the submission with feedback, score, and set status to "Reviewed"
      submission.feedback = feedback;
      submission.score = score;
      submission.review = feedback; // Store feedback in the review field
      submission.status = "Reviewed"; // Update status to 'Reviewed'
      await submission.save();

      // Respond with success message
      res.status(200).json({ message: "Feedback submitted successfully!" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  },
  reviewedAssignment: async (req, res) => {
    const userId = req.session.user.id;

    try {
      // Find reviewed assignments for the logged-in student
      const reviewedSubmissions = await AssignmentSubmission.find({
        submittedBy: userId,
        status: "Reviewed",
      })
        .populate("assignment course") // Populate assignment and course details
        .exec();

      res.json({ success: true, reviewedSubmissions });
    } catch (err) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
  getAnalyticsData: async (req, res) => {
    try {
      // Total students
      const totalStudents = await User.countDocuments({ role: "student" });

      // Total submissions
      const totalSubmissions = await AssignmentSubmission.countDocuments();

      // Pending submissions
      const reviewedSubmissions = await AssignmentSubmission.countDocuments({
        status: "Reviewed",
      });
      const pendingSubmissions = totalSubmissions - reviewedSubmissions;

      // Score distribution (group by score ranges)
      const scoreRanges = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const scoreDistribution = await AssignmentSubmission.aggregate([
        { $match: { status: "Reviewed" } },
        {
          $bucket: {
            groupBy: "$score", // Assuming 'score' field exists in submissions
            boundaries: scoreRanges,
            default: "100+",
            output: {
              count: { $sum: 1 },
            },
          },
        },
      ]);

      // Map score distribution to an array (for chart)
      const scoreDistributionArray = Array(scoreRanges.length - 1).fill(0);
      scoreDistribution.forEach((bucket) => {
        const index =
          scoreRanges.findIndex((range) => range === bucket._id) - 1;
        if (index >= 0) scoreDistributionArray[index] = bucket.count;
      });

      res.status(200).json({
        success: true,
        data: {
          totalStudents,
          submissions: totalSubmissions,
          pendingSubmissions,
          scoreDistribution: scoreDistributionArray,
        },
      });
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  },
};

module.exports = assignmentController;
