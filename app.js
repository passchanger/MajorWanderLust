if (process.env.NODE_ENV != "production") {
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");

// Routes
const bookingRoutes = require("./routes/booking.js");
const reviewRoutes = require("./routes/reviews.js");
const listingRoutes = require("./routes/listing.js");
const UserRouter = require("./routes/user.js");
const getAiResponse = require("./utils/ai.js");
const paymentRoutes = require("./routes/payment");

// Models
const Listing = require("./models/listing.js");

// Auth
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

// DB
const dburl = process.env.ATLASDB_URL;
async function main() {
    await mongoose.connect(dburl);
}
main()
    .then(() => console.log("connected to DB"))
    .catch(err => console.log(err));

// VIEW ENGINE
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

// MIDDLEWARE
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

// SESSION
const sessionOptions = {
    secret: process.env.SECRET || "mysupersecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
};

app.use(session(sessionOptions));
app.use(flash());

// PASSPORT
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// GLOBAL VARIABLES
app.use((req, res, next) => {
    res.locals.currUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

// =======================
// ROUTES
// =======================

// AI CHAT
app.post("/ai/chat", async (req, res) => {
    try {
        const { message } = req.body;
        const aiReply = await getAiResponse(message);
        res.json({ reply: aiReply });
    } catch (err) {
        console.error("Error:", err);
        res.json({ reply: "Server is busy. Try again!" });
    }
});

// SMART PACKING
app.get("/listings/:id/smart-pack", async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);
        const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date());
        const prompt = `I am visiting ${listing.location}, ${listing.country} in ${month}. 
                        1. Briefly describe the typical weather there in ${month}.
                        2. Give a 3-item essential packing list with emojis.
                        Keep it very short and professional.`;
        const advice = await getAiResponse(prompt);
        res.json({ advice, month });
    } catch (err) {
        console.error(err);
        res.status(500).json({ advice: "Pack for adventure!" });
    }
});

// APP ROUTES
app.use("/listings", listingRoutes);   // ✅ listing routes handle /:id/book
app.use("/bookings", bookingRoutes);
app.use("/listings/:id/reviews", reviewRoutes);
app.use("/", UserRouter);
app.use("/payment", paymentRoutes);

// ERROR HANDLING
app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    let { statusCode = 500, message = "Something Went Wrong!" } = err;
    res.status(statusCode).render("error.ejs", { message });
});

// SERVER
const PORT = 8085;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});