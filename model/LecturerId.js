const mongoose = require("mongoose")

const lecturerIdSchema = new mongoose.Schema({
    lecturerIdNo: { 
        type: Number, 
        required: true,
        unique: true
    }
    
  });
  
const LecturerId = mongoose.model('LecturerId', lecturerIdSchema);
  
module.exports = LecturerId;