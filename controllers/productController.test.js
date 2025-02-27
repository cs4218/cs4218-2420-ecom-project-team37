import { expect, jest } from "@jest/globals";
import braintree from 'braintree';
import { brainTreeTokenController, brainTreePaymentController } from './productController';
import orderModel from "../models/orderModel"; 

jest.mock('braintree', () => {
    const mockGenerate = jest.fn();
    const mockSale = jest.fn();
    const mockBraintreeGateway = jest.fn().mockImplementation(() => {
        return {
            clientToken: {
                generate: mockGenerate
            },
            transaction: {
                sale: mockSale
            }
        };
    });

    return {
        BraintreeGateway: mockBraintreeGateway,
        Environment: {
        Sandbox: 'sandbox'
        }
    };
});
jest.mock('../models/orderModel')

jest.spyOn(console, "log").mockImplementation(() => {});

describe("brainTreeTokenController unit tests", () => {
    let req, res;
    
    beforeEach(() => {
        jest.clearAllMocks();
        
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
    });
    
    it("should generate and return a token if no errors", async () => {
        const mockTokenResponse = {
            clientToken: 'mock-client-token',
        };
        
        const mockGateway = new braintree.BraintreeGateway();
        mockGateway.clientToken.generate.mockImplementation((options, callback) => {
            callback(null, mockTokenResponse);
        });
        
        await brainTreeTokenController(req, res);
        
        expect(mockGateway.clientToken.generate).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(mockTokenResponse);
    });

    it("should handle error when gateway client token throws error", async () => {
        const mockError = new Error('error');
        
        const mockGateway = new braintree.BraintreeGateway();
        mockGateway.clientToken.generate.mockImplementation((options, callback) => {
            callback(mockError, null);
        });
        
        await brainTreeTokenController(req, res);
        
        expect(mockGateway.clientToken.generate).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(mockError);
    });

    it("should handle error if callback function has error", async () => {
        const mockError = new Error('error');
        const mockCallBack = jest.fn().mockImplementation(() => {
            throw mockError;
        })
        const mockTokenResponse = {
            clientToken: 'mock-client-token',
        };
        
        const mockGateway = new braintree.BraintreeGateway();
        mockGateway.clientToken.generate.mockImplementation((options, callBack) => {
            mockCallBack(null, mockTokenResponse);
        });

        await brainTreeTokenController(req, res);
        
        expect(mockGateway.clientToken.generate).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(mockError);
    })
})

describe("brainTreePaymentController unit tests", () => {
    let req, res;
    
    beforeEach(() => {
        jest.clearAllMocks();
        
        req = {
            body: {
                nonce: 'test-nonce',
                cart: [
                    { name: 'Product 1', price: 100 },
                    { name: 'Product 2', price: 200 }
                ]
            },
            user: {
                _id: 'user123'
            }
          };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            json: jest.fn()
        };
    });

    it("should save order and return ok:true if no error", async () => {
        const mockResult = {
            success: true,
            transaction: {
              id: 'transaction1',
              amount: '300.00'
            }
        };
        const mockGateway = new braintree.BraintreeGateway();
        
        mockGateway.transaction.sale.mockImplementation((transactionDetails, callback) => {
            callback(null, mockResult);
        });
        orderModel.prototype.save = jest.fn();
    
        await brainTreePaymentController(req, res);

        expect(mockGateway.transaction.sale).toHaveBeenCalledWith(
            {
                amount: 300, 
                paymentMethodNonce: 'test-nonce',
                options: {
                    submitForSettlement: true
                }
            },
            expect.any(Function)
        );
        expect(orderModel).toHaveBeenCalledWith({
            products: req.body.cart,
            payment: mockResult,
            buyer: req.user._id
        });
        expect(orderModel.prototype.save).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it("should handle error when gateway transaction sale throws error", async () => {
        const mockError = new Error('error');
        const mockGateway = new braintree.BraintreeGateway();
        
        mockGateway.transaction.sale.mockImplementation((transactionDetails, callback) => {
            callback(mockError, null);
        });
        
        await brainTreePaymentController(req, res);
        
        expect(mockGateway.transaction.sale).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(mockError);
    })

    it("should handle error if callback function has error", async () => {
        const mockError = new Error('error');
        const mockCallBack = jest.fn().mockImplementation(() => {
            throw mockError;
        })
        const mockResult = {
            success: true,
            transaction: {
              id: 'transaction1',
              amount: '300.00'
            }
        };
        const mockGateway = new braintree.BraintreeGateway();
        
        mockGateway.transaction.sale.mockImplementation((transactionDetails, callback) => {
            mockCallBack(null, mockResult);
        });

        await brainTreePaymentController(req, res);
        
        expect(mockGateway.transaction.sale).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(mockError);
    });
});