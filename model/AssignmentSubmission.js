const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AssignmentSubmissionSchema = new Schema({
    assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true,
    },
    title: { type: String, required: true },
    status: {
        type: String,
        enum: ['Submitted', 'Reviewed'],
        default: 'Submitted',
    },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    filePath: { type: String, required: true },
    comments: { type: String },
    plagiarismCheck: { type: Boolean, default: false },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    submittedAt: { type: Date, default: Date.now },
    review: { type: String }, // Feedback from the lecturer
    score: { type: Number, min: 0, max: 100 },
});

const AssignmentSubmission = mongoose.model('AssignmentSubmission', AssignmentSubmissionSchema);
module.exports = AssignmentSubmission;
