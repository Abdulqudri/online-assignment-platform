const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    filePath: {
        type: String,
        default: null
    },
    submissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AssignmentSubmission' }],
    userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    expired: {
        type: Boolean,
        default: false
    }
},{timestamps: true});

const Assignment = mongoose.model('Assignment', AssignmentSchema);

module.exports = Assignment