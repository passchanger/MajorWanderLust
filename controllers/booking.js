const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");

// CREATE BOOKING
module.exports.createBooking = async (req, res) => {
    const { id } = req.params;
    const { checkIn, checkOut, guests } = req.body;

    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    // Calculate total price
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
console.log("✅ Nights:", nights, "Price:", listing.price, "Total:", Math.round(listing.price * nights * 1.12)); // ✅ debug

if (nights <= 0) {
        req.flash("error", "Invalid dates! Check-out must be after check-in.");
        return res.redirect(`/listings/${id}`);
    }

    const totalPrice = Math.round(listing.price * nights * 1.12); // with 12% tax

    const booking = new Booking({
        listing: id,
        user: req.user._id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests,
        totalPrice
    });

    await booking.save();
    req.flash("success", `Booking confirmed for ${nights} night(s)! Total: ₹${totalPrice.toLocaleString("en-IN")}`);
    res.redirect(`/bookings/${booking._id}`);
};

// SHOW BOOKING
module.exports.showBooking = async (req, res) => {
    const booking = await Booking.findById(req.params.bookingId)
        .populate("listing")
        .populate("user");

    if (!booking) {
        req.flash("error", "Booking not found!");
        return res.redirect("/listings");
    }

    if (!booking.user._id.equals(req.user._id)) {
        req.flash("error", "You don't have permission to view this booking!");
        return res.redirect("/listings");
    }

    res.render("bookings/show.ejs", { booking });
};

// MY BOOKINGS
module.exports.myBookings = async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate("listing")
        .sort({ createdAt: -1 });

    // ✅ filter out bookings where listing was deleted
    const validBookings = bookings.filter(b => b.listing !== null);

    res.render("bookings/index.ejs", { bookings: validBookings });
};
// CANCEL BOOKING
module.exports.cancelBooking = async (req, res) => {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
        req.flash("error", "Booking not found!");
        return res.redirect("/bookings");
    }

    if (!booking.user.equals(req.user._id)) {
        req.flash("error", "You don't have permission!");
        return res.redirect("/bookings");
    }

    booking.status = "cancelled";
    await booking.save();

    req.flash("success", "Booking cancelled successfully!");
    res.redirect("/bookings");
};