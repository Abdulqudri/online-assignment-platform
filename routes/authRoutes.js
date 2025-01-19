const express = require("express")
const {register, login, logout, adminLogin} = require("../controllers/authController")

const router = express.Router()

router.get("/login", (req, res) => {
    res.render('login', {layout: false})
})
router.get("/login/admin", (req, res) => {
    res.render('admin-login', {layout: false})
})
router.get("/register", (req, res) => {
    res.render('registration', {layout: false})
})
router.post("/register", register)

router.post("/login", login)
router.post("/login/admin", adminLogin)
router.post("/logout", logout)

module.exports = router;