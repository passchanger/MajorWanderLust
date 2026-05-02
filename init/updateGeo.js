const mongoose = require("mongoose");
const axios = require("axios");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

const DEFAULT_COORDINATES = [77.209, 28.6139]; // Delhi fallback

// 💤 delay function (IMPORTANT)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 🌍 fetch coordinates (FINAL FIXED)
async function fetchCoordinates(location, country) {
    let query = country ? `${location}, ${country}` : location;

    console.log("🔍 Updating:", query);

    try {
        const res = await axios.get(
            "https://nominatim.openstreetmap.org/search",
            {
                params: {
                    q: query,
                    format: "json",
                    limit: 1
                },
                headers: {
                    // 🔥 IMPORTANT (avoid 403)
                    "User-Agent": "WanderlustApp (vivekproject@gmail.com)"
                }
            }
        );

        const geo = res.data[0];

        if (geo) {
            console.log("✅ Found:", geo.lat, geo.lon);
            return [Number(geo.lon), Number(geo.lat)];
        }

        console.log("❌ Not found, using default");
        return DEFAULT_COORDINATES;

    } catch (err) {
        console.log("❌ Error:", err.response?.status || err.message);
        return DEFAULT_COORDINATES;
    }
}

// 🚀 update all listings
async function updateAll() {
    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to DB");

    const listings = await Listing.find();

    for (let l of listings) {
        const coords = await fetchCoordinates(l.location, l.country);

        l.geometry = {
            type: "Point",
            coordinates: coords
        };

        await l.save();

        console.log("✔ Updated:", l.title);

        // 🔥 VERY IMPORTANT (avoid 403)
        await sleep(1000); // 1 sec delay
    }

    console.log("🎉 All listings updated successfully!");
    mongoose.connection.close();
}

updateAll();