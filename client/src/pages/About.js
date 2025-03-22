import React from "react";
import Layout from "./../components/Layout";

const About = () => {
  return (
    <Layout title={"About us - Ecommerce app"}>
      <div className="row contactus">
        <div className="col-md-6 ">
          <img
            src="/images/about.jpeg"
            alt="contactus"
            style={{ width: "100%" }}
          />
        </div>
        <div className="col-md-4">
          <h1>About Us</h1>
          <h2>Our Mission</h2>
          <p className="text-justify mt-2">
            Our mission is to provide high-quality products at affordable prices
          </p>
          <h2>Our Team</h2>
          <p className="text-justify">
            Our team consists of passionate individuals dedicated to find all the bugs in the code
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default About;
