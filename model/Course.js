const mongoose = require("mongoose")

const courseSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    code: { 
        type: String, 
        required: true, 
        unique: true 
    },
    assignments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' }],
    lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }


})

  
  const Course = mongoose.model('Course', courseSchema);
  
  module.exports = Course;