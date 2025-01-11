module.exports = (io) => {const express = require("express")
const User = require("../model/User")
const Department = require("../model/Department")
const Course = require("../model/Course")
const Assignment = require("../model/Assignment")
const path = require('path')
const AssignmentSubmission = require("../model/AssignmentSubmission")
const Notification = require("../model/Notification")
const router = express.Router()

router.get("/", async (req, res) => {

    const userId = req.session.user.id
    try {
      const user = await User.findById(userId)
      if(!user){
        return res.status(404).redirect("/welcome")
      }
      res.render("index",{user})
    } catch (err) {
      res.status(500).json({message: "server error"})
    }
    
})
  
router.get("/view-assignments", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    await Notification.updateMany(
      { userId: userId, read: false, type: "newAssignment" },
      { $set: { read: true } }
    );

    // Emit an event to update unread count
    const unreadCount = await Notification.countDocuments({ userId, read: false , type: "newAssignment"});
    io.to(userId.toString()).emit("updateUnreadCount", { unreadCount });
    res.render("view-assignments", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/view-feedback", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    await Notification.updateMany(
      { userId: userId, read: false, type: "assignmentReview" },
      { $set: { read: true } }
    );

    // Emit an event to update unread count
    const unreadCount = await Notification.countDocuments({ userId, read: false , type: "assignmentReview"});
    io.to(userId.toString()).emit("updateUnreadCount", { unreadCount });
    res.render("view-feedback", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
}
})
router.get("/view-detail", async (req, res) => {
  const userId = req.session.user.id;
  const { id } = req.query; // Get the `id` from the query parameters

  try {
      // Fetch the user details
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).redirect("/auth/login");
      }

      // Fetch the assignment submission details using the ID
      const assignment = await Assignment.findById(id)
      .populate('course', 'name') // Populate course details
      .populate('userIds', 'name'); // Populate user details if needed

      if (!assignment) {
          return res.status(404).render("viewdetail", { user, message: "Assignment not found." });
      }
      console.log(assignment)
      // Render the viewdetail page with the submission data
      res.render("viewdetail", { user ,  assignment});
  } catch (err) {
      res.status(500).json({ message: "Server error" });
  }
});
router.get("/ass-detail/:id", async (req, res) => {
  const userId = req.session.user.id;
  const { id } = req.params; // Get the `id` from the query parameters

  try {
      // Fetch the user details
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).redirect("/auth/login");
      }

      // Fetch the assignment submission details using the ID
      const assignment = await AssignmentSubmission.findById(id)
      .populate('course', 'name code') // Populate course details
      .populate('submittedBy', 'name userId')// Populate user details if needed
      .populate('assignment', 'title')

      if (!assignment) {
          return res.status(404).render("view-submitted-detail", { user, message: "Assignment not found." });
      }
      console.log(assignment)
      // Render the viewdetail page with the submission data
      res.render("view-submitted-detail", { user ,  assignment});
  } catch (err) {
      res.status(500).json({ message: "Server error" });
  }
})

router.get("/submit-assignment", async(req, res) => {
  const userId = req.session.user.id
  const assignment = req.query.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("upload-assignment", {user, assignment})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/submission-history",async (req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("submission-history", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/update-profile", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("update-profile", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})


router.get("/create-assignments", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("create", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/view-submissions", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    await Notification.updateMany(
      { userId: userId, read: false, type: "assignmentSubmission" },
      { $set: { read: true } }
    );
    const unreadCount = await Notification.countDocuments({ userId, read: false});
    io.to(userId.toString()).emit("updateUnreadCount", { unreadCount });
    res.render("view", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/provide-feedback/:id", async (req, res) => {
  const submissionId = req.params.id; // Get the submission ID from the route parameter
  const userId = req.session.user.id
  try {
      const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
      const submission = await AssignmentSubmission.findById(submissionId)
          .populate('submittedBy', 'name userId')
          .exec();
      
      if (!submission) {
          return res.status(404).render('error', { message: 'Submission not found' });
      }
      console.log(submission)
      // Pass the submission details to the feedback form
      res.render('feedback', {
          user,
          submissionId: submissionId, // Pass submissionId to the view
          studentId: submission.submittedBy.userId, // Extract studentId from submittedBy
          assignmentTitle: submission.title // Extract assignment title from assignment
      });
  } catch (err) {
      res.status(500).json({ message: "Server error" });
  }
});

router.get("/assignment-analytics", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("ass-analytic", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/manage-plagiarism", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("plagmarism", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/manage-users", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("manage-users", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/platform-analytics", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("platform-analytic", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/generate-lecturerId", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("generate-lecturerId", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/admin-manage-course", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("admin-manage-course", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/student-manage-course", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("student-manage-course", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/lecturer-manage-course", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("lecturer-manage-course", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/feedback-details/:id", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("lecturer-manage-course", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})


const mimeTypes = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  zip: 'application/zip',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};



router.get('/documents/view/:filePath', (req, res) => {
    const filePath = path.join(__dirname, '../uploads', req.params.filePath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.sendFile(filePath);
});
router.get('/documents/download/:filePath', (req, res) => {
  const filePath = path.join(__dirname, '../uploads', req.params.filePath);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
  res.sendFile(filePath);
});



return router;


}