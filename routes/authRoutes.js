const express = require("express")
const {register, login, logout} = require("../controller/authController")

const router = express.Router()

router.get("/login", (req, res) => {
    res.render('login', {layout: false})
})
router.get("/register", (req, res) => {
    res.render('registration', {layout: false})
})
router.post("/register", register)

router.post("/login", login)
router.post("/logout", logout)

module.exports = router;