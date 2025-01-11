const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true, enum: ["newAssignment", "assignmentSubmission", "assignmentReview"] },
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
});

const Notification = mongoose.model('Notification', NotificationSchema);
 module.exports = Notification
