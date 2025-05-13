const mongoose = require("mongoose");
const config = require("config");
const dbURI = config.get("mongoURI");

const connectDB = async () => {
  try {
    await mongoose.connect(dbURI);

    console.log("Database Connected Successfully..!");
  } catch (error) {
    console.log(error.message);

    process.exit(1);
  }
};

module.exports = connectDB;
