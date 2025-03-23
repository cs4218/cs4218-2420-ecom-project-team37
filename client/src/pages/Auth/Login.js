import React, { useState } from "react";
import Layout from "./../../components/Layout";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import "../../styles/AuthStyles.css";
import { useAuth } from "../../context/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [auth, setAuth] = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // form function
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`/api/v1/auth/login`, {
        email,
        password,
      });
      if (res && res.data.success) {
        toast.success(res.data && res.data.message, {
          duration: 5000,
          icon: "🙏",
          style: {
            background: "green",
            color: "white",
          },
        });
        setAuth({
          ...auth,
          user: res.data.user,
          token: res.data.token,
        });
        localStorage.setItem("auth", JSON.stringify(res.data));
        navigate(location.state || "/");
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.log(error);
      if (error.response) {
        const { status, data } = error.response;

        if (status === 401) {
          toast.error("Incorrect password. Please try again.", {
            duration: 5000,
            style: {
              background: "#ff4d4f",
              color: "white",
            },
          });
        } else if (status === 404) {
          toast.error(
            "Email not registered. Please check your email or register a new account.",
            {
              duration: 5000,
              style: {
                background: "#ff4d4f",
                color: "white",
              },
            },
          );
        } else if (status === 400) {
          toast.error(
            data.message || "Please provide both email and password.",
            {
              duration: 5000,
              style: {
                background: "#ff4d4f",
                color: "white",
              },
            },
          );
        } else {
          toast.error("Something went wrong. Please try again later.", {
            duration: 5000,
            style: {
              background: "#ff4d4f",
              color: "white",
            },
          });
        }
      } else {
        toast.error("Something went wrong. Please try again later.", {
          duration: 5000,
          style: {
            background: "#ff4d4f",
            color: "white",
          },
        });
      }
    }
  };
  return (
    <Layout title="Login - Ecommerce App">
      <div className="form-container " style={{ minHeight: "90vh" }}>
        <form onSubmit={handleSubmit}>
          <h4 className="title">LOGIN FORM</h4>

          <div className="mb-3">
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control"
              id="exampleInputEmail1"
              placeholder="Enter Your Email "
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              id="exampleInputPassword1"
              placeholder="Enter Your Password"
              required
            />
          </div>
          <div className="mb-3">
            <button
              type="button"
              className="btn forgot-btn"
              onClick={() => {
                navigate("/forgot-password");
              }}
            >
              Forgot Password
            </button>
          </div>

          <button type="submit" className="btn btn-primary">
            LOGIN
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default Login;
