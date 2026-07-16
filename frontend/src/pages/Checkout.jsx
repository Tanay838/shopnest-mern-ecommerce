import React, { useState, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { clearCart } from "../redux/cartSlice";

const Checkout = () => {
  const { user } = useContext(AuthContext);
  const cartItems = useSelector((state) => state.cart.cartItems);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [address, setAddress] = useState({
    fullName: "",
    street: "",
    city: "",
    postalCode: "",
    country: "",
  });

  const totalPrice = cartItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );

  const saveOrder = async (paymentId) => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({
        items: cartItems,
        totalAmount: totalPrice,
        address,
        paymentId,
      }),
    });

    if (res.ok) {
      dispatch(clearCart());
      navigate("/ordersuccess");
    } else {
      alert("Order saving failed");
    }
  };

  const handleCOD = async () => {
    await saveOrder("COD_" + Date.now());
  };

  const handleRazorpay = async () => {
    try {
      const orderRes = await fetch("/api/payment/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: totalPrice,
        }),
      });

      if (!orderRes.ok) {
        alert("Payment Gateway not configured.");
        return;
      }

      const order = await orderRes.json();

      const options = {
        key: "rzp_test_TD5sULNxiXGj6h", // Replace with your Test Key

        amount: order.amount,

        currency: order.currency,

        order_id: order.id,

        name: "ShopNest",

        description: "Order Payment",

        handler: async function (response) {
          const verify = await fetch("/api/payment/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(response),
          });

          if (verify.ok) {
            await saveOrder(response.razorpay_payment_id);
          } else {
            alert("Payment Verification Failed");
          }
        },

        prefill: {
          name: address.fullName,
          email: user.email,
          contact: "9999999999",
        },

        theme: {
          color: "#f97316",
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.open();
    } catch (err) {
      console.log(err);
      alert("Payment Failed");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    if (paymentMethod === "cod") {
      handleCOD();
    } else {
      handleRazorpay();
    }
  };

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>

      <form className="shipping-form" onSubmit={handleSubmit}>
        <input
          placeholder="Full Name"
          required
          value={address.fullName}
          onChange={(e) =>
            setAddress({ ...address, fullName: e.target.value })
          }
        />

        <input
          placeholder="Street"
          required
          value={address.street}
          onChange={(e) =>
            setAddress({ ...address, street: e.target.value })
          }
        />

        <input
          placeholder="City"
          required
          value={address.city}
          onChange={(e) =>
            setAddress({ ...address, city: e.target.value })
          }
        />

        <input
          placeholder="Postal Code"
          required
          value={address.postalCode}
          onChange={(e) =>
            setAddress({
              ...address,
              postalCode: e.target.value,
            })
          }
        />

        <input
          placeholder="Country"
          required
          value={address.country}
          onChange={(e) =>
            setAddress({
              ...address,
              country: e.target.value,
            })
          }
        />

        <h3>Payment Method</h3>

        <label>
          <input
            type="radio"
            checked={paymentMethod === "cod"}
            onChange={() => setPaymentMethod("cod")}
          />
          Cash On Delivery
        </label>

        <br />

        <label>
          <input
            type="radio"
            checked={paymentMethod === "razorpay"}
            onChange={() => setPaymentMethod("razorpay")}
          />
          Razorpay
        </label>

        <h2>₹ {totalPrice.toFixed(2)}</h2>

        <button className="btn" type="submit">
          {paymentMethod === "cod"
            ? "Place Order"
            : "Pay with Razorpay"}
        </button>
      </form>
    </div>
  );
};

export default Checkout;