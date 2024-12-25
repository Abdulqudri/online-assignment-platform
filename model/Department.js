const mongoose = require("mongoose")

const departmentSchema = new mongoose.Schema({
  departmentName: { type: String, required: true },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }], // Referencing Course model
});
  
const Department = mongoose.model('Department', departmentSchema);
  
module.exports = Department;