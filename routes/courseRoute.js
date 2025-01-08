const express = require("express");
const {
  createDept,
  deleteDept,
  getAllDept,
  createCourse,
  getCourses,
  saveCourse,
  getLecturerCourse,
  getRegisterCourse,
  saveStudentCourse,
} = require("../controllers/courseController");

const router = express.Router();

router.post("/new-dept", createDept);
router.post("/delete-dept/:id", deleteDept);
router.get("/all-dept", getAllDept);
router.post("/new-course/:id", createCourse);
router.get("/departments/:id/courses", getCourses);
router.post("/save-courses", saveCourse);
router.post("/save-student-courses", saveStudentCourse);
router.get("/get-lecturer-courses", getLecturerCourse);

router.get("/get-registered-courses", getRegisterCourse);

module.exports = router;
