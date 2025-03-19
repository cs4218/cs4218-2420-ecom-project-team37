import mongoose from "mongoose";
import { jest } from "@jest/globals";
import connectDB from "./db.js";

jest.mock("mongoose");
jest.spyOn(console, "log").mockImplementation(() => {});

describe("MongoDB Connection Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should log connected to DB when successful", async () => {
    const returnValue = { connection: { host: "localhost" } };
    mongoose.connect.mockResolvedValue(returnValue);
    await connectDB();

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Connected To Mongodb Database"),
    );
  });

  it("Should log error when connection fails", async () => {
    const error = new Error("Mongodb error");
    mongoose.connect.mockRejectedValue(error);
    await connectDB();

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Error in Mongodb"),
    );
  });
});
