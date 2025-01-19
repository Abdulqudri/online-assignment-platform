const express = require("express")
const { create, getAll, accept, reject, approvedRequest } = require("../controllers/RequestController")
const router = express.Router()

router.post("/request-submit/:id", create)
router.get("/get-all", getAll)
router.post("/accept-request/:id", accept)
router.post("/reject-request/:id", reject)
router.get("/approved-request", approvedRequest)
module.exports = router