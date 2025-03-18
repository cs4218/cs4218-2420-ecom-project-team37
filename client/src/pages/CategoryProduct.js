import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/CategoryProductStyles.css";
import axios from "axios";

const CategoryProduct = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState({});

  useEffect(() => {
    if (params?.slug) getProductsByCategory();
  }, [params?.slug]);

  const getProductsByCategory = async () => {
    try {
      const response = await axios.get(
        `/api/v1/product/product-category/${params.slug}`,
      );
      setProducts(response?.data?.products || []);
      setCategory(response?.data?.category || {});
    } catch (error) {
      console.log(error);
    }
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) {
      return 'N/A';
    }
    
    try {
      return price.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });
    } catch (error) {
      console.log("Error formatting price:", error);
      return 'N/A';
    }
  };

  return (
    <Layout>
      <div className="container mt-3 category">
        <h4 className="text-center">Category - {category?.name || ''}</h4>
        <h6 className="text-center">{products?.length} result found </h6>
        <div className="row">
          <div className="col-md-9 offset-1">
            <div className="d-flex flex-wrap">
              {products?.map((p) => (
                <div className="card m-2" key={p?._id || Math.random().toString()}>
                  <img
                    src={`/api/v1/product/product-photo/${p?._id}`}
                    className="card-img-top"
                    alt={p?.name || 'Product'}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/150';
                    }}
                  />
                  <div className="card-body">
                    <div className="card-name-price">
                      <h5 className="card-title">{p?.name || 'Unnamed Product'}</h5>
                      <h5 className="card-title card-price">
                        {formatPrice(p?.price)}
                      </h5>
                    </div>
                    <p className="card-text ">
                      {p?.description ? p.description.substring(0, 60) + '...' : 'No description available'}
                    </p>
                    <div className="card-name-price">
                      <button
                        className="btn btn-info ms-1"
                        onClick={() => p?.slug && navigate(`/product/${p.slug}`)}
                      >
                        More Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CategoryProduct;
