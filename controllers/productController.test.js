import { expect, jest } from "@jest/globals";
import braintree from 'braintree';
import { brainTreeTokenController } from './productController'; 

jest.mock('braintree', () => {
    const mockGenerate = jest.fn();
    const mockBraintreeGateway = jest.fn().mockImplementation(() => {
        return {
            clientToken: {
                generate: mockGenerate
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
