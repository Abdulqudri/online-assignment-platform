const mongoose = require("mongoose")
const Schema = mongoose.Schema

const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    userId: {
        type: Number,
    },
    lecturerId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LecturerId',
    },
    password: {
        type: String,
        required: true
},

    department: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department', 
    },
    courses: [{ type: mongoose.Schema.Types.ObjectId,
        ref: 'Course', 
    }],
    role: { 
        type: String,
        enum: ['lecturer', 'student', 'admin'],
        required: true
    },

})

const User = mongoose.model('User', UserSchema)
module.exports = User;