import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import connectDB from "./db.js";

jest.spyOn(console, "log").mockImplementation(() => {});

describe("MongoDB Connection", () => {
  let mongoServer;

  beforeEach(async () => {
    // Use in-memory database to simualte actual MongoDB and prevent accidentally modifying/deleting the actual database
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongoServer.getUri();
  });

  afterEach(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  test("should connect to MongoDB successfully", async () => {
    await connectDB();
    expect(mongoose.connection.readyState).toBe(1); // db connected
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Connected To Mongodb Database"),
    );
  });

  test("should throw error if invalid mongoDB uri", async () => {
    process.env.MONGO_URL = "invalidMongoUri";
    await connectDB();

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Error in Mongodb"),
    );
  });

  test("should throw error if no mongoDB uri in env", async () => {
    delete process.env.MONGO_URL;
    await connectDB();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Error in Mongodb"),
    );
  });
});
