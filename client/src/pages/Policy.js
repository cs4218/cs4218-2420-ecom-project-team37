import React from "react";
import Layout from "./../components/Layout";

const Policy = () => {
  return (
    <Layout title={"Privacy Policy"}>
      <div className="row contactus ">
        <div className="col-md-6 ">
          <img
            src="/images/contactus.jpeg"
            alt="contactus"
            style={{ width: "100%" }}
          />
        </div>
        <div className="col-md-4">
          <h1 className="bg-dark p-2 text-white text-center">PRIVACY POLICY</h1>
          <p className="text-justify mt-2">
            <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
          </p>
          
          <h5 className="mt-4">Information We Collect</h5>
          <p>
            We collect personal information that you provide when creating an account, 
            placing an order, or contacting customer service, including your name, email, 
            address, and payment details.
          </p>
          
          <h5 className="mt-4">How We Use Your Information</h5>
          <p>
            We use your information to process orders, manage your account, personalize 
            your shopping experience, and communicate with you about products, services, 
            and promotions.
          </p>
          
          <h5 className="mt-4">Information Sharing</h5>
          <p>
            We do not sell or rent your personal information to third parties. We may 
            share information with service providers who help us operate our business 
            and deliver products to you.
          </p>
          
          <h5 className="mt-4">Cookies & Tracking</h5>
          <p>
            We use cookies and similar technologies to enhance your browsing experience, 
            analyze site traffic, and personalize content.
          </p>
          
          <h5 className="mt-4">Your Rights</h5>
          <p>
            You have the right to access, correct, or delete your personal information. 
            Contact us using the information below to exercise these rights.
          </p>
          
          <h5 className="mt-4">Security</h5>
          <p>
            We implement appropriate security measures to protect your personal information 
            from unauthorized access or disclosure.
          </p>
          
          <h5 className="mt-4">Contact Us</h5>
          <p>
            If you have questions about this Privacy Policy, please contact us at:
            <br />
            <a href="mailto:privacy@ecommerceapp.com">privacy@ecommerceapp.com</a>
            <br />
            012-3456789
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Policy;
