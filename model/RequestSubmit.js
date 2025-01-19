const mongoose = require("mongoose")
const requestSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
    },
    assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    },
    dueDate: {
        type: Date, // Optional feedback from the instructor
    },
}, { timestamps: true });

const RequestSubmit = mongoose.model("RequestSubmit", requestSchema);
module.exports = RequestSubmit;
