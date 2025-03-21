import mongoose from "mongoose";
import colors from "colors";

const connectDB = async () => {
  try {
    const dbUrl = process.env.TEST_MODE 
      ? process.env.MONGO_TEST_URL 
      : process.env.MONGO_URL;
      
    const conn = await mongoose.connect(dbUrl);
    console.log(
      `Connected To Mongodb Database ${conn.connection.host} (${process.env.TEST_MODE ? 'TEST' : 'PRODUCTION'})`.bgMagenta.white,
    );
  } catch (error) {
    console.log(`Error in Mongodb ${error}`.bgRed.white);
  }
};

export default connectDB;
