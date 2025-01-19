const Assignment = require("../model/Assignment");
const Course = require("../model/Course");
const RequestSubmit = require("../model/RequestSubmit");
const User = require("../model/User");

const RequestController = {
    create: async (req, res) => {
        try {
          const { id, course, reason } = req.body; // User ID, Course ID, Reason
          const assignmentId = req.params.id; // Assignment ID from URL params
      
          // Validate required fields
          if (!id || !course || !reason) {
            return res.status(400).json({
              msg: "All fields are required",
            });
          }
      
          // Check if the user has already submitted a request for this assignment
          const existingRequest = await RequestSubmit.findOne({
            user: id,
            assignment: assignmentId,
          });
      
          if (existingRequest) {
            return res.status(400).json({
              msg: "You have already submitted a request for this assignment.",
            });
          }
      
          // Validate the course
          const courseData = await Course.findById(course);
          if (!courseData) {
            return res.status(404).json({
              msg: "Course not found.",
            });
          }
      
          // Validate the assignment
          const assignment = await Assignment.findById(assignmentId);
          if (!assignment) {
            return res.status(404).json({
              msg: "Assignment not found.",
            });
          }
      
          // Validate the user
          const user = await User.findById(id);
          if (!user) {
            return res.status(404).json({
              msg: "User not found.",
            });
          }
      
          // Create a new request
          const request = new RequestSubmit({
            user: user._id,
            assignment: assignment._id,
            course: courseData._id,
            reason,
          });
          await request.save();
      
          res.status(201).json({
            msg: "Request created successfully.",
          });
        } catch (error) {
          console.error("Error creating assignment request:", error);
          res.status(500).json({
            message: "An error occurred while creating the request.",
          });
        }
      },
      
  getAll: async (req, res) => {
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

      // Fetch all submissions with Pending status for these assignments
      const submissions = await RequestSubmit.find({
        assignment: { $in: assignmentIds },
        status: "Pending", // Only include requests with Pending status
      })
        .populate("assignment", "title")
        .populate("user", "name userId") // Get student details
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: {
          submissions,
        },
      });
    } catch (error) {
      console.error("Error fetching assignment requests:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error.",
        error: error.message,
      });
    }
  },
  accept: async (req, res) => {
    const id = req.params.id;

    try {
      const { dueDateTime } = req.body;
      console.log(dueDateTime);
      console.log(req.body);
      if (!dueDateTime) {
        return res.status(400).json({
            success: false,
          msg: "All fields are required",
        });
      }
      const request = await RequestSubmit.findById(id);
      if (!request) {
        return res.status(400).json({
            success: false,
          msg: "no request found",
        });
      }
      request.status = "Approved";
      request.dueDate = dueDateTime;
      await request.save();
      res.status(200).json({
        success: true,
        msg: "approved successfully",
      });
    } catch (error) {
      console.error("Error Requesting assignment:", error);
      res.status(500).json({ message: "Error Requesting assignment",
      success: false });
    }
  },
  reject: async (req, res) => {
    const id = req.params.id;
    try {
      const request = await RequestSubmit.findById(id);
      if (!request) {
        return res.status(400).json({
          msg: "no request found",
          success: false
        });
      }
      request.status = "Rejected";
      request.save();
      res.status(200).json({
        msg: "rejected successfully",
        success: true
      });
    } catch (error) {
      console.error("Error Requestion assignment:", error);
      res.status(500).json({ message: "Error Requesting assignment",
      success: false });
    }
  },
  approvedRequest: async (req, res) => {
    try {
        const studentId = req.session.user.id; // Assuming session contains student data

        // Fetch all approved requests for the logged-in student
        const submissions = await RequestSubmit.find({
            user: studentId,
            status: "Approved", // Only include approved requests
        })
            .populate("assignment", "title dueDate")
            .populate("course", "name code") // Get course details
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: { submissions },
        });
    } catch (error) {
        console.error("Error fetching approved requests for student:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message,
        });
    }
    }
};

module.exports = RequestController;
