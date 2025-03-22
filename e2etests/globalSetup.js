import mongoose from "mongoose";
import dotenv from "dotenv";
import { hashPassword } from "../helpers/authHelper.js";
import userModel from "../models/userModel.js";
import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";

dotenv.config();

async function globalSetup() {
  try {
    // Connect using the modified URL from connectDB
    process.env.TEST_MODE = 'true';
    await mongoose.connect(process.env.MONGO_URL.replace(/\/[^/]*$/, '/e2e_test'));
    
    // Clear any existing test data
    await mongoose.connection.dropDatabase();

    // Create users
    const testUsers = [
      {
        email: "test-user@example.com",
        name: "Test User",
        answer: "Volleyball",
        address: "Test Address",
        phone: "12345678",
        password: await hashPassword("test123"),
        role: 0,
      },
      {
        email: "test-admin@example.com",
        name: "Test Admin",
        answer: "Volleyball",
        address: "Test Address",
        phone: "12345678",
        password: await hashPassword("test123"),
        role: 1,
      },
    ];

    const createdUsers = await userModel.insertMany(testUsers);

    // Create categories
    const categories = await categoryModel.insertMany([
      { name: "TEST-Category One", slug: "test-category-one" },
      { name: "TEST-Category Two", slug: "test-category-two" },
    ]);

    // Create products
    const products = await productModel.insertMany([
      {
        name: "TEST-Product One",
        slug: "test-product-one",
        price: 100,
        quantity: 100,
        category: categories[0]._id,
        description: "Test Product One Description",
      },
      {
        name: "TEST-Product Two",
        slug: "test-product-two",
        price: 200,
        quantity: 100,
        category: categories[0]._id,
        description: "Test Product Two Description",
      },
    ]);

    const orders = await orderModel.insertMany([
      {
        "products": [ products[0]._id, products[1]._id ],
        "payment": {
          "errors": {
            "validationErrors": {},
            "errorCollections": {
              "transaction": {
                "validationErrors": {
                  "amount": [
                    {
                      "attribute": "amount",
                      "code": "81503",
                      "message": "Amount is an invalid format."
                    }
                  ]
                },
                "errorCollections": {
                  "creditCard": {
                    "validationErrors": {
                      "number": [
                        {
                          "attribute": "number",
                          "code": "81717",
                          "message": "Credit card number is not an accepted test number."
                        }
                      ]
                    },
                    "errorCollections": {}
                  }
                }
              }
            }
          },
          "params": {
            "transaction": {
              "amount": "3004.9700000000003",
              "paymentMethodNonce": "tokencc_bh_c36kjx_t6mnd5_c2mzrt_7rdc6j_nb4",
              "options": {
                "submitForSettlement": "true"
              },
              "type": "sale"
            }
          },
          "message": "Amount is an invalid format.\nCredit card number is not an accepted test number.",
          "success": false
        },
        "buyer": createdUsers[0]._id,
        "status": "Not Processed",
      },
      {
        "products": [ products[0]._id],
        "payment": {
          "errors": {
            "validationErrors": {},
            "errorCollections": {
              "transaction": {
                "validationErrors": {
                  "amount": [
                    {
                      "attribute": "amount",
                      "code": "81503",
                      "message": "Amount is an invalid format."
                    }
                  ]
                },
                "errorCollections": {
                  "creditCard": {
                    "validationErrors": {
                      "number": [
                        {
                          "attribute": "number",
                          "code": "81717",
                          "message": "Credit card number is not an accepted test number."
                        }
                      ]
                    },
                    "errorCollections": {}
                  }
                }
              }
            }
          },
          "params": {
            "transaction": {
              "amount": "3004.9700000000003",
              "paymentMethodNonce": "tokencc_bh_c36kjx_t6mnd5_c2mzrt_7rdc6j_nb4",
              "options": {
                "submitForSettlement": "true"
              },
              "type": "sale"
            }
          },
          "message": "Amount is an invalid format.\nCredit card number is not an accepted test number.",
          "success": false
        },
        "buyer": createdUsers[0]._id,
        "status": "Cancelled",
      }
    ])


    console.log("Test data inserted.");
    await mongoose.connection.close();
  } catch (error) {
    console.error("Error in global setup:", error);
    throw error;
  }
}

export default globalSetup;
