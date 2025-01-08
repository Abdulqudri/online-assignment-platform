const checkAuth = (req, res, next) => {
    if (req.session.user) {
      return next();
    }
  
    return res.status(401).redirect("/welcome");
};
module.exports = checkAuth