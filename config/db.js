import mongoose from "mongoose";
import colors from "colors";

const connectDB = async () => {
  try {
    // Get base MONGO_URL from env
    const baseUrl = process.env.MONGO_URL;

    // When run playwright, it will set TEST_MODE to true and modify the URL to use a test database
    const dbUrl = process.env.TEST_MODE
      ? baseUrl.replace(/\/[^/]*$/, "/e2e_test") // Create test DB with collection name ./e2etest
      : baseUrl;

    const conn = await mongoose.connect(dbUrl);
    console.log(
      `Connected To Mongodb Database ${conn.connection.host} (${process.env.TEST_MODE ? "TEST" : "PRODUCTION"}) at ${dbUrl}`
        .bgMagenta.white,
    );
  } catch (error) {
    console.log(`Error in Mongodb ${error}`.bgRed.white);
  }
};

export default connectDB;
