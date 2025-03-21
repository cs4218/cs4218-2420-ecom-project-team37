import { hashPassword, comparePassword } from "./authHelper";

jest.spyOn(console, "log").mockImplementation(() => {});

// integration test with bcrypt
describe("authHelper integration tests", () => {
  let plainPassword;

  beforeEach(() => {
    plainPassword = "password";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should hash a password correctly", async () => {
    const hashedPassword = await hashPassword(plainPassword);

    expect(hashedPassword).toBeDefined();
    expect(typeof hashedPassword).toBe("string");
    expect(hashedPassword).not.toBe(plainPassword);
  });

  it("should return an error when hashing undefined", async () => {
    const hashedPassword = await hashPassword(undefined);

    expect(hashedPassword).toBeUndefined();
    expect(console.log).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should return true when comparing a hashed password", async () => {
    const hashedPassword = await hashPassword(plainPassword);

    const isMatch = await comparePassword(plainPassword, hashedPassword);
    expect(isMatch).toBe(true);
  });

  it("should return false for an incorrect password", async () => {
    const hashedPassword = await hashPassword(plainPassword);

    const isMatch = await comparePassword("wrongPassword", hashedPassword);
    expect(isMatch).toBe(false);
  });

  it("should return false if hashedPassword is invalid", async () => {
    const isMatch = await comparePassword(plainPassword, "invalidHash");
    expect(isMatch).toBe(false);
  });

  it("compare password should not return true for empty password and hashedPassword", async () => {
    const isMatch = await comparePassword("", "");

    expect(isMatch).toBe(false);
  });

  // if accidentally call funciton with nulls, dont want it to match to true since it is not a valid password
  it("compare password should not return true for null password and hashedPassword", async () => {
    const isMatch = await comparePassword(null, null);

    expect(isMatch).not.toBe(true);
    expect(console.log).toHaveBeenCalledWith(expect.any(Error));
  });
});
