const express = require("express");
const router = express.Router();
const WrapAsync = require("../utils/WrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controllers/booking.js");

// MY BOOKINGS
router.get("/", isLoggedIn, WrapAsync(bookingController.myBookings));

// SHOW BOOKING
router.get("/:bookingId", isLoggedIn, WrapAsync(bookingController.showBooking));

// CANCEL BOOKING
router.post("/:bookingId/cancel", isLoggedIn, WrapAsync(bookingController.cancelBooking));

module.exports = router;