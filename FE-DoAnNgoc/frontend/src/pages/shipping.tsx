import { Button, Card, Form, Input, message, Steps } from "antd";
import { useEffect, useState } from "react";
import {
  CartReducerInitialState,
  cartSeletor,
  resetCart,
  saveShippingInfo,
} from "../redux/reducers/cartReducer";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import handleAPI from "../apis/handleAPI";
import { OrderRequest } from "../models/OrderModel";

const stripePromise = loadStripe(
  "pk_test_51QDR2TBH1dxfGQfnpLHocDcc9oPDLViuzFi7FMmsAEYFWVoHzp3svcQv1ta4KGJMtYqYc3Cf7VNyjvhY30qdQ3P300GApl3ncj"
);

// Đặt PaymentForm bên ngoài Shipping
const PaymentForm = ({
  handlePaymentSuccess,
  dispatch,
  current,
  setCurrent,
  isProcessing,
  setIsProcessing,
}: any) => {
  const stripe = useStripe();
  const elements = useElements();

  const handlePay = async () => {
    if (!stripe || !elements) {
      message.error("Stripe has not loaded yet.");
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.origin },
        redirect: "if_required",
      });

      if (error) {
        throw new Error(error.message || "Payment failed.");
      }

      if (paymentIntent?.status === "succeeded") {
        await handlePaymentSuccess(); // Xử lý đơn hàng
        dispatch(resetCart());
        setCurrent(current + 1); // Chuyển sang Step 3
      }
    } catch (err: any) {
      message.error(err.message || "An error occurred during payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card style={{ width: "45%", margin: "auto" }}>
      <Form
        layout="vertical"
        onFinish={handlePay}
        size="large"
        disabled={isProcessing}
      >
        <PaymentElement />
        <Button
          type="primary"
          htmlType="submit"
          loading={isProcessing}
          style={{ marginTop: "20px", width: "100%" }}
        >
          Pay
        </Button>
      </Form>
    </Card>
  );
};

const Shipping = () => {
  const cartData: CartReducerInitialState = useSelector(cartSeletor);
  const [form] = Form.useForm();
  const [current, setCurrent] = useState(0);
  const [clientSecret, setClientSecret] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (cartData.cartItems.length <= 0) navigate("/cart");
  }, []);

  const next = () => setCurrent((prev) => prev + 1);
  const prev = () => setCurrent((prev) => prev - 1);

  const handleShippingInfo = async (shippingInfo: any) => {
    dispatch(saveShippingInfo(shippingInfo));
    try {
      const res = await handleAPI(
        "/payment/create",
        { amount: cartData.total },
        "post"
      );
      setClientSecret(res.data.clientSecret);
      next();
    } catch (error: any) {
      message.error(error.message || "Failed to process payment.");
    }
  };

  const handlePaymentSuccess = async () => {
    const orderData: OrderRequest = {
      shippingInfo: cartData.shippingInfo,
      orderItems: cartData.cartItems,
      subtotal: cartData.subtotal,
      tax: cartData.tax,
      discount: cartData.discount,
      shippingCharges: cartData.shippingCharges,
      total: cartData.total,
    };

    try {
      const res = await handleAPI("/order/new", orderData, "post");
      message.success(res.data.message || "Order successfully placed!");
    } catch (error: any) {
      message.error(error.message || "Failed to create order.");
    }
  };

  const steps = [
    {
      title: "Shipping Info",
      content: (
        <Card style={{ width: "45%", margin: "auto" }}>
          <Form
            layout="vertical"
            form={form}
            onFinish={handleShippingInfo}
            size="middle"
          >
            <Form.Item
              name="address"
              label="Address"
              rules={[
                { required: true, message: "Please enter your address!" },
              ]}
            >
              <Input maxLength={100} allowClear />
            </Form.Item>
            <Form.Item
              name="city"
              label="City"
              rules={[{ required: true, message: "Please enter your city!" }]}
            >
              <Input maxLength={100} allowClear />
            </Form.Item>
            <Form.Item
              name="state"
              label="State"
              rules={[{ required: true, message: "Please enter your state!" }]}
            >
              <Input maxLength={100} allowClear />
            </Form.Item>
            <Form.Item
              name="country"
              label="Country"
              rules={[
                { required: true, message: "Please enter your country!" },
              ]}
            >
              <Input maxLength={100} allowClear />
            </Form.Item>
            <Form.Item
              name="pinCode"
              label="Pin Code"
              rules={[
                { required: true, message: "Please enter your pin code!" },
              ]}
            >
              <Input maxLength={6} allowClear />
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      title: "Payment",
      content: clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm
            handlePaymentSuccess={handlePaymentSuccess}
            dispatch={dispatch}
            current={current}
            setCurrent={setCurrent}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        </Elements>
      ) : (
        <p>Loading payment details...</p>
      ),
    },
    {
      title: "Complete",
      content: (
        <div style={{ textAlign: "center", margin: "40px" }}>
          <h2>Order Complete!</h2>
          <p>Thank you for your purchase.</p>
        </div>
      ),
    },
  ];

  return (
    <div
      style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}
    >
      <div style={{ width: "80%" }}>
        <Steps current={current}>
          {steps.map((step) => (
            <Steps.Step key={step.title} title={step.title} />
          ))}
        </Steps>
        <div style={{ margin: "24px 0" }}>{steps[current].content}</div>
        <div>
          {current < steps.length - 1 && current !== 1 && (
            <Button type="primary" onClick={() => form.submit()}>
              Next
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button type="primary" onClick={() => navigate("/orders")}>
              My orders
            </Button>
          )}
          {current > 0 && current < steps.length - 1 && (
            <Button style={{ margin: "0 8px" }} onClick={prev}>
              Previous
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shipping;
