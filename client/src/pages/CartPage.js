import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import { useNavigate } from "react-router-dom";
import DropIn from "braintree-web-drop-in-react";
import axios from "axios";
import toast from "react-hot-toast";
import "../styles/CartStyles.css";

const CartPage = () => {
  const [auth, setAuth] = useAuth();
  const [cart, setCart] = useCart();
  const [clientToken, setClientToken] = useState("");
  const [instance, setInstance] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Safely format price
  const formatPrice = (price) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return 'N/A';
    
    try {
      return numPrice.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });
    } catch (error) {
      console.log("Error formatting price:", error);
      return 'N/A';
    }
  };

  // total price calculation with error handling
  const totalPrice = () => {
    if (!Array.isArray(cart)) return formatPrice(0);
    
    let total = 0;
    cart.forEach((item) => {
      if (!item) return;
      
      // Handle non-numeric or missing price values
      const price = parseFloat(item?.price);
      if (!isNaN(price)) {
        total += Math.abs(price);
      }
    });
    
    return formatPrice(total);
  };

  // delete item with improved error handling
  const removeCartItem = (pid) => {
    try {
      if (!pid || !Array.isArray(cart)) return;
      
      let myCart = [...cart];
      let index = myCart.findIndex((item) => item?._id === pid);
      
      // Make sure we found a valid index
      if (index !== -1) {
        myCart.splice(index, 1);
        setCart(myCart);
        localStorage.setItem("cart", JSON.stringify(myCart));
      }
    } catch (error) {
      console.log("Error removing cart item:", error);
    }
  };

  // get payment gateway token with improved error handling
  const getToken = async () => {
    try {
      const response = await axios.get("/api/v1/product/braintree/token");
      
      // Verify that response.data exists and has the expected structure
      if (response?.data && typeof response.data === 'object') {
        setClientToken(response.data.clientToken || "");
      }
    } catch (error) {
      console.log("Error fetching token:", error);
    }
  };

  useEffect(() => {
    if (auth?.token) {
      getToken();
    }
  }, [auth]);

  // handle payments with robust error handling and response validation
  const handlePayment = async () => {
    try {
      if (!instance) {
        console.log("Payment instance not available");
        return;
      }
      
      setLoading(true);
      const { nonce } = await instance.requestPaymentMethod();
      
      const response = await axios.post("/api/v1/product/braintree/payment", {
        nonce,
        cart,
      });
      
      // Check if payment was successful
      if (response?.data?.success) {
        localStorage.removeItem("cart");
        setCart([]);
        navigate("/dashboard/user/orders");
        toast.success("Payment Completed Successfully ");
      } else {
        // Handle partial or failed payment
        toast.error(response?.data?.message || "Payment failed");
      }
    } catch (error) {
      console.log("Payment error:", error);
      toast.error("Payment processing failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Safely access cart length
  const getCartLength = () => {
    if (!cart || !Array.isArray(cart)) return 0;
    return cart.length;
  };

  // Safely truncate description text
  const truncateDescription = (description) => {
    if (!description) return "No description available";
    
    try {
      return description.substring(0, 30) + (description.length > 30 ? "..." : "");
    } catch (error) {
      return "No description available";
    }
  };

  return (
    <Layout>
      <div className="cart-page">
        <div className="row">
          <div className="col-md-12">
            <h1 className="text-center bg-light p-2 mb-1">
              {!auth?.user
                ? "Hello Guest"
                : `Hello ${auth?.token && auth?.user?.name || "User"}`}
              <p className="text-center">
                {getCartLength() > 0
                  ? `You have ${getCartLength()} items in your cart ${
                      auth?.token ? "" : "please login to checkout!"
                    }`
                  : "Your Cart Is Empty"}
              </p>
            </h1>
          </div>
        </div>
        <div className="container ">
          <div className="row ">
            <div className="col-md-7 p-0 m-0">
              {Array.isArray(cart) && cart.map((p, index) => {
                if (!p) return null;
                return (
                  <div className="row card flex-row" key={p?._id || `cart-item-${index}`}>
                    <div className="col-md-4">
                      <img
                        src={p?._id ? `/api/v1/product/product-photo/${p._id}` : "https://via.placeholder.com/150"}
                        className="card-img-top"
                        alt={p?.name || "Product"}
                        width="100%"
                        height={"130px"}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/150";
                        }}
                      />
                    </div>
                    <div className="col-md-4">
                      <p>{p?.name || "Unnamed Product"}</p>
                      <p>{truncateDescription(p?.description)}</p>
                      <p>Price : {p?.price || "N/A"}</p>
                    </div>
                    <div className="col-md-4 cart-remove-btn">
                      <button
                        className="btn btn-danger"
                        onClick={() => p?._id && removeCartItem(p._id)}
                        disabled={!p?._id}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="col-md-5 cart-summary ">
              <h2>Cart Summary</h2>
              <p>Total | Checkout | Payment</p>
              <hr />
              <h4>Total : {totalPrice()} </h4>
              {auth?.user?.address ? (
                <>
                  <div className="mb-3">
                    <h4>Current Address</h4>
                    <h5>{auth?.user?.address}</h5>
                    <button
                      className="btn btn-outline-warning"
                      onClick={() => navigate("/dashboard/user/profile")}
                    >
                      Update Address
                    </button>
                  </div>
                </>
              ) : (
                <div className="mb-3">
                  {auth?.token ? (
                    <button
                      className="btn btn-outline-warning"
                      onClick={() => navigate("/dashboard/user/profile")}
                    >
                      Update Address
                    </button>
                  ) : (
                    <button
                      className="btn btn-outline-warning"
                      onClick={() =>
                        navigate("/login", {
                          state: "/cart",
                        })
                      }
                    >
                      Please Login to checkout
                    </button>
                  )}
                </div>
              )}
              <div className="mt-2">
                {!clientToken || !auth?.token || getCartLength() === 0 ? (
                  ""
                ) : (
                  <>
                    <DropIn
                      options={{
                        authorization: clientToken,
                        paypal: {
                          flow: "vault",
                        },
                      }}
                      onInstance={(instance) => setInstance(instance)}
                    />

                    <button
                      className="btn btn-primary"
                      onClick={handlePayment}
                      disabled={loading || !instance || !auth?.user?.address}
                    >
                      {loading ? "Processing ...." : "Make Payment"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
