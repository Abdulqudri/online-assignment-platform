const express = require("express")
const checkPermission = require("../middleware/checkPermission")
const { lecturerId } = require("../controller/usercontroller")

const router = express.Router()

router.post("/createId",  lecturerId)
module.exports = router