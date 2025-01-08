const express = require("express")
const checkPermission = require("../middleware/checkPermission")
const { lecturerId, deleteUser, getAllUser, analysis } = require("../controllers/userController")

const router = express.Router()

router.post("/createId",  lecturerId)
router.post("/delete-user/:id", deleteUser)
router.get("/all-users", getAllUser)
router.get("/analytic", analysis)
module.exports = router