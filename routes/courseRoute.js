const express = require("express")
const {createDept, deleteDept, getAllDept, createCourse} = require("../controller/courseController")

const router = express.Router()

router.post("/new-dept", createDept)
router.post("/delete-dept/:id", deleteDept)
router.get("/all-dept", getAllDept)
router.post("/new-course/:id", createCourse)

module.exports = router
