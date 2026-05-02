const Listing = require("../models/listing.js");
const axios = require("axios");
const mongoose = require("mongoose");
const ExpressError = require("../utils/ExpressError");

// DEFAULTS
const DEFAULT_COORDINATES = [77.209, 28.6139]; // Delhi
const DEFAULT_IMAGE = {
    url: "https://placehold.co/1200x800?text=Wanderlust",
    filename: "wanderlust-placeholder"
};

// CATEGORIES
const listingCategories = [
    { label: "Trending", icon: "fa-solid fa-fire" },
    { label: "Rooms", icon: "fa-solid fa-bed" },
    { label: "Iconic cities", icon: "fa-solid fa-mountain-city" },
    { label: "Mountains", icon: "fa-solid fa-mountain" },
    { label: "Castles", icon: "fa-solid fa-archway" },
    { label: "Arctic", icon: "fa-solid fa-snowflake" },
    { label: "Camping", icon: "fa-solid fa-campground" },
    { label: "Farms", icon: "fa-solid fa-tractor" },
    { label: "Domes", icon: "fa-solid fa-igloo" },
    { label: "Boats", icon: "fa-solid fa-ship" },
    { label: "Amazing pools", icon: "fa-solid fa-person-swimming" }
];

module.exports.listingCategories = listingCategories;

// FETCH COORDINATES
async function fetchCoordinates(location, country) {
    let query = country ? `${location}, ${country}` : `${location}, India`;

    try {
        const response = await axios.get("https://nominatim.openstreetmap.org/search", {
            params: { q: query, format: "json", limit: 1 },
            headers: { "User-Agent": "WanderlustApp/1.0" }
        });

        const geo = response.data[0];
        if (!geo) return DEFAULT_COORDINATES;
        return [Number(geo.lon), Number(geo.lat)];

    } catch (error) {
        return DEFAULT_COORDINATES;
    }
}

// SEARCH SAFE
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// INDEX
module.exports.index = async (req, res) => {
    const { category, q } = req.query;
    const filters = {};

    if (category) filters.category = category;

    if (q && q.trim()) {
        const searchRegex = new RegExp(escapeRegex(q.trim()), "i");
        filters.$or = [
            { title: searchRegex },
            { location: searchRegex },
            { country: searchRegex },
            { category: searchRegex }
        ];
    }

    const allListings = await Listing.find(filters);

    res.render("listings/index.ejs", {
        allListings,
        categories: listingCategories,
        activeCategory: category || "",
        searchQuery: q || ""
    });
};

// NEW FORM
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs", { categories: listingCategories });
};

// SHOW LISTING
module.exports.showListing = async (req, res, next) => {
    let { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ExpressError(404, "Listing Not Found"));
    }

    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: { path: "author" }
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
};

// CREATE LISTING
module.exports.createListings = async (req, res) => {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    if (req.file) {
        newListing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
    } else {
        newListing.image = DEFAULT_IMAGE;
    }

    newListing.geometry = {
        type: "Point",
        coordinates: await fetchCoordinates(
            newListing.location,
            newListing.country
        )
    };

    await newListing.save();

    req.flash("success", "Listing Created!");
    res.redirect("/listings");
};

// EDIT
module.exports.editListings = async (req, res) => {
    let { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.redirect("/listings");
    }

    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url.replace("/upload", "/upload/h_300,w_250");

    res.render("listings/edit.ejs", {
        listing,
        originalImageUrl,
        categories: listingCategories
    });
};

// UPDATE
module.exports.updateListings = async (req, res) => {
    let { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.redirect("/listings");
    }

    const listing = await Listing.findByIdAndUpdate(id, req.body.listing, { new: true });

    if (req.file) {
        listing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
    }

    listing.geometry = {
        type: "Point",
        coordinates: await fetchCoordinates(
            listing.location,
            listing.country
        )
    };

    await listing.save();

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${listing._id}`);
};

// DELETE
module.exports.deleteListings = async (req, res) => {
    let { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.redirect("/listings");
    }

    await Listing.findByIdAndDelete(id);

    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};