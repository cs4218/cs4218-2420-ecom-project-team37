import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Checkbox, Radio } from "antd";
import { Prices } from "../components/Prices";
import { useCart } from "../context/cart";
import axios from "axios";
import toast from "react-hot-toast";
import Layout from "./../components/Layout";
import { AiOutlineReload } from "react-icons/ai";
import "../styles/Homepages.css";

const HomePage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [checked, setChecked] = useState([]);
  const [radio, setRadio] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Safely format price
  const formatPrice = (price) => {
    const numPrice = parseFloat(price);
    if (price === undefined || price === null || isNaN(numPrice)) {
      return 'N/A';
    }
    
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

  // Safely truncate description
  const truncateDescription = (description) => {
    if (!description) return "No description available";
    
    try {
      return description.substring(0, 60) + "...";
    } catch (error) {
      return "No description available";
    }
  };

  // get all categories
  const getAllCategory = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category");
      if (data?.success) {
        setCategories(data?.category || []);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAllCategory();
    getTotal();
  }, []);

  // get products
  const getAllProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/v1/product/product-list/${page}`);
      setLoading(false);
      setProducts(data?.products || []);
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  // get total count
  const getTotal = async () => {
    try {
      const { data } = await axios.get("/api/v1/product/product-count");
      setTotal(data?.total || 0);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (page === 1) return;
    loadMore();
  }, [page]);

  // load more
  const loadMore = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/v1/product/product-list/${page}`);
      setLoading(false);
      setProducts([...products, ...(data?.products || [])]);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  // filter by category
  const handleFilter = (value, id) => {
    let all = [...checked];
    if (value) {
      all.push(id);
    } else {
      all = all.filter((c) => c !== id);
    }
    setChecked(all);
  };

  useEffect(() => {
    if (!checked.length || !radio.length) getAllProducts();
  }, [checked.length, radio.length]);

  useEffect(() => {
    if (checked.length || radio.length) filterProduct();
  }, [checked, radio]);

  // get filtered product
  const filterProduct = async () => {
    try {
      const { data } = await axios.post("/api/v1/product/product-filters", {
        checked,
        radio,
      });
      setProducts(data?.products || []);
    } catch (error) {
      console.log(error);
    }
  };

  // Safely add to cart
  const handleAddToCart = (product) => {
    if (!product) return;
    
    try {
      setCart([...cart, product]);
      localStorage.setItem("cart", JSON.stringify([...cart, product]));
      toast.success("Item Added to cart");
    } catch (error) {
      console.log("Error adding to cart:", error);
      toast.error("Failed to add item to cart");
    }
  };

  return (
    <Layout title={"ALL Products - Best offers "}>
      {/* banner image */}
      <img
        src="/images/Virtual.png"
        className="banner-img"
        alt="bannerimage"
        width={"100%"}
      />
      {/* banner image */}
      <div className="container-fluid row mt-3 home-page">
        <div className="col-md-3 filters">
          <h4 className="text-center">Filter By Category</h4>
          <div className="d-flex flex-column">
            {categories?.map((c) => (
              <Checkbox
                key={c?._id || Math.random().toString()}
                onChange={(e) => handleFilter(e.target.checked, c?._id)}
              >
                {c?.name || "Unnamed Category"}
              </Checkbox>
            ))}
          </div>
          {/* price filter */}
          <h4 className="text-center mt-4">Filter By Price</h4>
          <div className="d-flex flex-column">
            <Radio.Group onChange={(e) => setRadio(e.target.value)}>
              {Prices?.map((p) => (
                <div key={p?._id || Math.random().toString()}>
                  <Radio value={p?.array}>{p?.name || "Unnamed Price Range"}</Radio>
                </div>
              ))}
            </Radio.Group>
          </div>
          <div className="d-flex flex-column">
            <button
              className="btn btn-danger"
              onClick={() => window.location.reload()}
            >
              RESET FILTERS
            </button>
          </div>
        </div>
        <div className="col-md-9 ">
          <h1 className="text-center">All Products</h1>
          <div className="d-flex flex-wrap">
            {Array.isArray(products) && products.map((p) => {
              if (!p) return null;
              return (
                <div className="card m-2" key={p?._id || Math.random().toString()}>
                  <img
                    src={p?._id ? `/api/v1/product/product-photo/${p._id}` : "https://via.placeholder.com/150"}
                    className="card-img-top"
                    alt={p?.name || "Product Image"}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/150";
                    }}
                  />
                  <div className="card-body">
                    <div className="card-name-price">
                      <h5 className="card-title">{p?.name || "Unnamed Product"}</h5>
                      <h5 className="card-title card-price">
                        {formatPrice(p?.price)}
                      </h5>
                    </div>
                    <p className="card-text ">
                      {truncateDescription(p?.description)}
                    </p>
                    <div className="card-name-price">
                      <button
                        className="btn btn-info ms-1"
                        onClick={() => p?.slug && navigate(`/product/${p.slug}`)}
                        disabled={!p?.slug}
                      >
                        More Details
                      </button>
                      <button
                        className="btn btn-dark ms-1"
                        onClick={() => handleAddToCart(p)}
                      >
                        ADD TO CART
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="m-2 p-3">
            {products && Array.isArray(products) && products.length > 0 && products.length < total && (
              <button
                className="btn loadmore"
                onClick={(e) => {
                  e.preventDefault();
                  setPage(page + 1);
                }}
              >
                {loading ? (
                  "Loading ..."
                ) : (
                  <>
                    {" "}
                    Loadmore 
                    {/* <AiOutlineReload /> */}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
