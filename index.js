const express = require("express")
const mongoose = require("mongoose")
require("dotenv").config()
const http = require('http')
const { Server } = require('socket.io')
const session = require("express-session")
const mongoDbStore = require("connect-mongodb-session")(session)
const expressLayouts = require('express-ejs-layouts');
const path = require("path")
const router = require("./routes/authRoutes")
const viewRoutes = require("./routes/viewRoutes")
const userRoutes = require("./routes/UserRoutes")
const courseRoutes = require("./routes/courseRoute")
const assignmentRoutes = require("./routes/assignmentRoutes")
const checkAuth = require("./middleware/checkAuth")

const port = process.env.PORT
const mongo_uri = process.env.MONGO_URI

//initializing express app
const app = express()
const server = http.createServer(app)
const io = new Server(server)


// connecting to database
mongoose.connect(mongo_uri) 
  .then(() => console.log('Connected!'));

const store = new mongoDbStore({
  uri: mongo_uri,
  collection: "my-session"
})

app.use(session({
  secret: process.env.SESSION_KEY, 
  resave: false, 
  saveUninitialized: false, 
  cookie: {
    secure: false, 
    httpOnly: true, 
    maxAge: 24 * 60 * 60 * 1000 
  },
  store: store
}));


io.on("connection", (socket) => {
  // ...
});

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Set EJS as the view engine
app.set('view engine', 'ejs');
app.use(expressLayouts)
// Set the directory for the views
app.set('views', path.join(__dirname, 'views'));
app.set('layout', './layouts/dashboard');
// Middleware to parse JSON
app.use(express.json());

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

app.get("/welcome", (req, res) => {
    res.render("welcome", {layout: false})
})
app.use("/auth", router)
app.get("/about", (req, res) => {
  const user = req?.session.user
  res.render("about", {layout: false, user})
})
app.use(courseRoutes)
app.use(userRoutes)
app.use(checkAuth)
app.use(viewRoutes(io))
app.use(assignmentRoutes(io))


mongoose.connection.once("open", () => {
  server.listen(port, () => {
    console.log(`listening to  http://localhost:${port}`)
  })
  
})

