import { jest } from "@jest/globals";
import bcrypt from "bcrypt";
import { hashPassword, comparePassword } from "./authHelper";

jest.mock("bcrypt");
jest.mock("./authHelper.js");

describe("Auth Helper Test", () => {
    describe("Unit tests", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            jest.spyOn(console, "log").mockImplementation(() => {});
            bcrypt.hash = jest.fn();
            bcrypt.compare = jest.fn();
        })

        describe("hashPassword Tests", () => {
            it("Should return hashed password", async() => {
                const password = "password123";
                const expectedHashedPassword = "hashedPassword";
                bcrypt.hash.mockResolvedValue(expectedHashedPassword);

                const hashedPassword = await hashPassword(password);

                expect(hashedPassword).toEqual(expectedHashedPassword);
            })

            it("Should log error when bcrypt throws error", async() => {
                const password = "password123";
                const error = new Error("bcrypt error");
                bcrypt.hash.mockRejectedValue(error);

                await hashPassword(password);

                expect(console.log).toHaveBeenCalledWith(error);
            })
        });
    
        describe("comparePassword Tests", () => {
            it("Should return true when passwords match", async() => {
                const password = "password123";
                const hashedPassword = "hashedPassword";
                bcrypt.compare.mockResolvedValue(true);

                const result = await comparePassword(password, hashedPassword);

                expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
                expect(result).toEqual(true);
            })

            it("Should return false when passwords dont match", async() => {
                const password = "password123";
                const hashedPassword = "hashedPassword";
                bcrypt.compare.mockResolvedValue(false);

                const result = await comparePassword(password, hashedPassword);

                expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
                expect(result).toEqual(false);
            });
        });
    })

    // describe("Integration tests", () => {
    //     describe("hashPassword bcrypt Tests", () => {
    //         it ("Should return a valid hashed password for non empty string", async () => {
    //             const password = "password123";
    //             const hashedPassword = await hashPassword(password);
                
    //             expect(hashedPassword).toBeDefined();
    //             expect(hashedPassword).not.toBe(password); 
    //         }) 

    //         // pw is non-empty string
           
    //         // pw is empty string
    
    //         // pw is int?
    
    //         // pw is object 
    
    //         // pw is null
    //     });
    
    //     describe("comparePassword Tests", () => {
    //         // pw match hashed pw
    
    //         // pw doesnt match hashed pw
    
    //         // pw is empty string, hashed pw isnt empty
    
    //         // pw is empty string, hashed pw is empty string
    
    //         // pw is null, hashed pw is null 
    
    //         // pw is null, hashed pw is not null
    
    //         // pw is not null, hashed pw is null
    
            
    //     });
        
    //     it("Should return true when hash password and check if match", async() => {
    //         const password = "password123";
    //         const hashedPassword = await hashPassword(password);
    //         const result = await comparePassword(password, hashedPassword);
    //         expect(result).toEqual(true);
    //     })
    // })
})
