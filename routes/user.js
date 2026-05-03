const express = require("express");
const WrapAsync = require("../utils/WrapAsync");
const router = express.Router();
const User = require("../models/user.js");
const passport = require("passport");
const {saveRedirectUrl} = require("../middleware.js");
const userController = require("../controllers/user.js")

router.get("/signup", userController.renderSignUpForm)

router.post("/signup", WrapAsync(userController.signUp)
);

router.get("/login", userController.renderLoginForm);

router.post("/login",
  saveRedirectUrl,
  (req,res,next)=>{
    console.log("LOGIN BODY:", req.body);
    next();
  },
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true
  }),
  userController.login
);
router.get("/logout", userController.logOut);

module.exports = router;