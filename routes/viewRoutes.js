const express = require("express")
const User = require("../model/User")
const Department = require("../model/Department")
const Course = require("../model/Course")

const router = express.Router()

router.get("/dashboard", async (req, res) => {

    const userId = req.session.user.id
    try {
      const user = await User.findById(userId)
      if(!user){
        return res.status(404).redirect("/auth/login")
      }
      res.render("index",{user})
    } catch (err) {
      res.status(500).json({message: "server error"})
    }
    
})
  
router.get("/view-assignments", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("view-assignments", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/view-feedback", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("view-feedback", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/upload-assignments", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("upload-assignment", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/submission-history",async (req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("submission-history", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/update-profile", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("update-profile", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})


router.get("/create-assignments", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("create", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/view-submissions", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("view", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/provide-feedback", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("feedback", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/assignment-analytics", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("ass-analytic", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/manage-plagiarism", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("plagmarism", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/manage-users", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("manage-users", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/platform-analytics", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("platform-analytic", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/generate-lecturerId", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("generate-lecturerId", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/admin-manage-course", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("admin-manage-course", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/student-manage-course", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("student-manage-course", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})
router.get("/lecturer-manage-course", async(req, res) => {
  const userId = req.session.user.id
  try {
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).redirect("/auth/login")
    }
    res.render("lecturer-manage-course", {user})
  } catch (err) {
    res.status(500).json({message: "server error"})
  }
  
})


  
module.exports = router