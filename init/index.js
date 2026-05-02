const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main().then(()=>{
    console.log("connected to DB");
}).catch((err)=>{
    console.log(err);
});

async function main() {
    await mongoose.connect(MONGO_URL);
}
const initDb = async () =>{
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({
    ...obj,
    owner: '68a50f2fbdb46a7b0a4a37cc',
    geometry: {
        type: "Point",
        coordinates: [77.2090, 28.6139] // Delhi
    }
}));
    await Listing.insertMany(initData.data);
    console.log("data was inserted");
};

initDb();