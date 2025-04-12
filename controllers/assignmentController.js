const { scanFile } = require("../util/plagiarism");

module.exports = (io) => { 
    
    const Assignment = require("../model/Assignment");
    const AssignmentSubmission = require("../model/AssignmentSubmission");
    const Course = require("../model/Course");
    const User = require("../model/User");

    const Notification = require('../model/Notification'); // Store unread notifications for each user
    io.on('connection', (socket) => {
      console.log('A user connected:', socket.id);
      // User joins their notification room
      socket.on('join', async (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their room`);
      });

      // // Listen for newAssignment event
      socket.on('newAssignment',async (data) => {
        const { studentId } = data;

        // Add the notification to the database
        const notification = await Notification.findOne({ userId: studentId });
    
        // Emit the notification to the specific student's room
        io.to(studentId).emit('newAssignmentNotification', {
          message: notification.message,
          unreadCount: 1
        });
        io.to(studentId).emit('newAssignmentNotification', {
          message: notification.message,
          unreadCount: 1
        });
        io.to(studentId).emit('assignmentReviewNotification', {
          message: notification.message,
          unreadCount: 1
        });
      });
    
      //When the student views an assignment
      socket.on('viewedAssignment', async (data) => {
        const { studentId, assignmentId } = data;
    
        // Update the notification as read in the database
        await Notification.updateOne(
          { userId: studentId, 'notifications.assignmentId': assignmentId },
          { $set: { 'notifications.$.isRead': true } }
        );
    
        // Fetch the updated unread count
        const notification = await Notification.findOne({ userId: studentId });
        const unreadCount = notification.notifications.filter((n) => !n.isRead).length;
    
        // Emit an event to update the unread count
        io.to(studentId).emit('updateUnreadCount', { unreadCount });
      });
    
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    const assignmentController = {
      // Create Assignment (For Lecturers)
      createAssignment: async (req, res) => {
        try {
          const { title, description, dueDate, course } = req.body;

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
          const studentIds = users.map(user => user._id.toString());
          
          
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
            filePath,
            userIds: users.map((user) => user._id),
          });
          await newAssignment.save();

          const notifications = studentIds.filter(id => id !== req.session.user.id.toString())
          .map(id => ({
            userId: id,
            type: "newAssignment",
            assignmentId: newAssignment._id,
            message: `New assignment: ${title}`,
            read: false
          }))

          await Notification.insertMany(notifications);

          notifications.forEach(notification => {
            io.to(notification.userId.toString()).emit('newAssignmentNotification', {
              
              message: notification.message,
              unreadCount: 1
            });
          });

          

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
              .json({ success: false, message: "User not found or not logged in." });
          }
      
          // Fetch the assignment
          const assignment = await Assignment.findById(assignment_id).populate("course");
          if (!assignment) {
            return res
              .status(404)
              .json({ success: false, message: "Assignment not found." });
          }
      
          // Verify the assignment belongs to a course the user is enrolled in
          if (!user.courses.some((course) => course._id.equals(assignment.course._id))) {
            return res
              .status(403)
              .json({ success: false, message: "User not enrolled in this course." });
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
            course: assignment.course._id,
            filePath,
            comments: comments || null,
            submittedBy: userId,
          });
      
          // Update the assignment submissions
          assignment.submissions.push(submission._id);
          await assignment.save();
      
          // Save the submission
          await submission.save();
          
          // Notify all lecturers associated with the course
          const lecturers = await User.find({
            role: "lecturer",
            courses: assignment.course._id,
          });
      
          const notifications = lecturers.map((lecturer) => ({
            userId: lecturer._id,
            type: "assignmentSubmission",
            read: false,
            message: `New submission received for assignment: ${submission.title}`,
            relatedId: submission._id,
            assignmentId: assignment._id
          }));
      
          try {
            // Save notifications to the database
            const savedNotifications = await Notification.insertMany(notifications);
      
            // Emit real-time notifications to relevant lecturers
            lecturers.forEach((lecturer) => {
              const lecturerId = lecturer._id.toString();
              const notification = savedNotifications.find(
                (notif) => notif.userId.toString() === lecturerId
              );
      
              if (notification) {
                io.to(lecturerId).emit("submitAssignmentNotification", {
                  message: notification.message,
                  unreadCount: 1,
                });
              }
            });
          } catch (notificationError) {
            console.error("Error handling notifications:", notificationError);
          }
         
          //await scanFile(submission._id)
      
          res.status(201).json({
            success: true,
            message: "Assignment submitted successfully.",
            submission,
          });
        } catch (error) {
          console.error("Error submitting assignment:", error);
          res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message,
          });
        }
      }
      ,

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
          })
          .populate("course", "name")
          .populate({
            path: 'submissions', // Populate the submissions
            match: { submittedBy: userId }, // Only include submissions for the current student
            select: 'status', // Only include the status field
          })
          .sort({ createdAt: -1 })
          const today = Date.now()
          assignments.forEach(async (ass) => {
            ass.expired = today > ass.dueDate ? true : false;
            await ass.save()
          })
          const assignmentStatuses = assignments.map(assignment => ({
            assignmentId: assignment._id,
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.dueDate,
            submitted: assignment.submissions.length > 0, // True if the student has submitted
            status: assignment.expired ? "expired" : (assignment.submissions[0]?.status || 'pending'), // 'submitted', 'graded', or 'not submitted'
          }));
          // Mark notifications for assignments as read
          
          res.status(200).json({ success: true, data: assignmentStatuses });
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
          const notification = new Notification({
            userId: submission.submittedBy, // Notify the student who submitted the assignment
            type: "assignmentReview", // New type for reviewed assignments
            read: false,
            assignmentId: submission.assignment._id,
            message: `Your submission for assignment "${submission.assignment.title}" has been reviewed.`,
            createdAt: new Date(),
        });

        await notification.save();

        // Emit a real-time notification to the student
        const studentId = submission.submittedBy._id.toString();
        io.to(studentId).emit("assignmentReviewNotification", {
            message: notification.message,
            unreadCount: 1,
        });

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
      deleteNotification: async (req, res) => {
        try {
          const { notificationId } = req.body;
          const userId = req.session.user.id;
      
          // Remove the notification
          await Notification.findOneAndDelete({ _id: notificationId, userId });
      
          // Emit an event to update unread count
          const unreadCount = await Notification.countDocuments({ userId, read: false });
          io.to(userId.toString()).emit("updateUnreadCount", { unreadCount });
      
          res.status(200).json({ message: "Notification removed successfully" });
        } catch (error) {
          console.error("Error removing notification:", error);
          res.status(500).json({ message: "Server error" });
        }
      }, 
      readNotification: async (req, res) => {
        try {
          const studentId = req.session.user.id;
      
          // Mark all unread notifications for the student as read
          await Notification.updateMany({ userId: studentId, read: false }, { $set: { read: true } });
      
          const unreadCount = await Notification.countDocuments({ userId: studentId, read: false });
          io.to(studentId.toString()).emit("updateUnreadCount", { unreadCount });
      
          res.status(200).json({ message: "Notifications marked as read" });
        } catch (error) {
          console.error("Error marking notifications as read:", error);
          res.status(500).json({ message: "Server error" });
        }
      },
      notifications: async (req, res) => {
        try {
          const userId = req.session.user.id; // Get user ID from session or JWT
          const notifications = await Notification.find({ userId , read: false , type: "newAssignment"})
            .sort({ createdAt: -1 }); // Sort by most recent
      
          res.status(200).json(notifications); // Send notifications as response
        } catch (error) {
          console.error("Error fetching notifications:", error);
          res.status(500).json({ error: "Failed to fetch notifications" });
        }
      },
      submissionNotifications: async (req, res) => {
        try {
          const userId = req.session.user.id; // Get user ID from session or JWT
          const notifications = await Notification.find({ userId , read: false, type: "assignmentSubmission"})
            .sort({ createdAt: -1 }); // Sort by most recent
      
          res.status(200).json(notifications); // Send notifications as response
        } catch (error) {
          console.error("Error fetching notifications:", error);
          res.status(500).json({ error: "Failed to fetch notifications" });
        }
      },reviewNotifications: async (req, res) => {
        try {
          const userId = req.session.user.id; // Get user ID from session or JWT
          const notifications = await Notification.find({ userId , read: false, type: "assignmentReview"})
            .sort({ createdAt: -1 }); // Sort by most recent
      
          res.status(200).json(notifications); // Send notifications as response
        } catch (error) {
          console.error("Error fetching notifications:", error);
          res.status(500).json({ error: "Failed to fetch notifications" });
        }
      }
    };



    return assignmentController;
}