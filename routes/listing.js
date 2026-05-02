const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const WrapAsync = require("../utils/WrapAsync.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listing.js");
const bookingController = require("../controllers/booking.js"); // ✅ moved to top
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

// TEST ROUTE
router.get("/test", (req, res) => {
    res.send("TEST OK");
});

// MAP ROUTE
router.get("/map/all", WrapAsync(async (req, res) => {
    const listings = await Listing.find({});
    res.render("listings/map.ejs", { listings });
}));

// INDEX + CREATE
router.route("/")
    .get(WrapAsync(listingController.index))
    .post(
        isLoggedIn,
        upload.single("listing[image]"),
        validateListing,
        WrapAsync(listingController.createListings)
    );

// NEW
router.get("/new", isLoggedIn, listingController.renderNewForm);

// BOOKING ✅ must be ABOVE /:id
router.post("/:id/book", isLoggedIn, WrapAsync(bookingController.createBooking));

// EDIT
router.get("/:id/edit", isLoggedIn, isOwner, WrapAsync(listingController.editListings));

// SHOW / UPDATE / DELETE
router.route("/:id")
    .get((req, res, next) => {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next();
        }
        return listingController.showListing(req, res, next);
    })
    .put(
        isLoggedIn,
        isOwner,
        upload.single("listing[image]"),
        validateListing,
        WrapAsync(listingController.updateListings)
    )
    .delete(
        isLoggedIn,
        isOwner,
        WrapAsync(listingController.deleteListings)
    );

module.exports = router;