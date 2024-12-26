import { Button, message, Skeleton } from "antd";
import { Order, OrderItem } from "../models/OrderModel";
import { Link, useNavigate, useParams } from "react-router-dom";
import handleAPI from "../apis/handleAPI";
import { useEffect, useState } from "react";

const defaultData: Order = {
  shippingInfo: {
    address: "",
    city: "",
    state: "",
    country: "",
    pinCode: "",
  },
  status: "",
  subtotal: 0,
  discount: 0,
  shippingCharges: 0,
  tax: 0,
  total: 0,
  orderItems: [],
  user: { name: "", _id: "" },
  _id: "",
};

const OrderDetails = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
  const [isLoadingReceive, setIsLoadingReceive] = useState(false);
  const [orderDetail, setOrderDetail] = useState<Order>();

  const getOrderDetail = async () => {
    const api = `/order/${params.id!}`;
    setIsLoading(true);
    try {
      const res = await handleAPI(api);
      setOrderDetail(res.data.order);
      console.log(res.data.order);
    } catch (error: any) {
      message.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getOrderDetail();
  }, []);

  const {
    shippingInfo: { address, city, state, country, pinCode },
    orderItems,
    user: { name },
    status,
    tax,
    subtotal,
    total,
    discount,
    shippingCharges,
  } = orderDetail || defaultData;

  const cancelOrder = async () => {
    const api = `/order/cancel/${orderDetail?._id}`;
    setIsLoadingUpdate(true);
    try {
      const res = await handleAPI(api, [], "put");
      message.success(res.data.message);
      navigate("/orders");
    } catch (error: any) {
      message.error(error);
    } finally {
      setIsLoadingUpdate(false);
    }
  };

  const receiveOrder = async () => {
    const api = `/order/receive/${orderDetail?._id}`;
    setIsLoadingReceive(true);
    try {
      const res = await handleAPI(api, [], "put");
      message.success(res.data.message);
      navigate("/orders");
    } catch (error: any) {
      message.error(error);
    } finally {
      setIsLoadingReceive(false);
    }
  };

  return (
    <div className="admin-container">
      <main className="product-management">
        {isLoading ? (
          <Skeleton />
        ) : (
          <>
            <section
              style={{
                padding: "2rem",
              }}
            >
              <h2>Order Items</h2>

              {orderItems.map((i) => (
                <ProductCard
                  key={i._id}
                  name={i.name}
                  screen={i.screen}
                  ram_ssd={i.ram_ssd}
                  color={i.color}
                  photo={i.photo}
                  productId={i.productId}
                  _id={i._id}
                  quantity={i.quantity}
                  price={i.price}
                />
              ))}
            </section>

            <article className="shipping-info-card">
              <h1>Order Info</h1>
              <h5>User Info</h5>
              <p>Name: {name}</p>
              <p>
                Address:{" "}
                {`${address}, ${city}, ${state}, ${country} ${pinCode}`}
              </p>
              <h5>Amount Info</h5>
              <p>Subtotal: {subtotal}</p>
              <p>Shipping Charges: {shippingCharges}</p>
              <p>Tax: {tax}</p>
              <p>Discount: {discount}</p>
              <p>Total: {total}</p>

              <h5>Status Info</h5>
              <p>
                Status:{" "}
                <span
                  className={
                    status === "Đã nhận hàng"
                      ? "green"
                      : status === "Đang giao hàng"
                        ? "purple"
                        : "red"
                  }
                >
                  {status}
                </span>
              </p>
              {status === "Chờ xác nhận" ? (
                <Button
                  loading={isLoadingUpdate}
                  disabled={isLoadingUpdate}
                  onClick={cancelOrder}
                  type="primary"
                  className="shipping-btn"
                >
                  Cancel order
                </Button>
              ) : (
                <span></span>
              )}
              {
                status === "Đang giao hàng" && (
                  <Button
                    loading={isLoadingReceive}
                    disabled={isLoadingReceive}
                    onClick={receiveOrder}
                    type="primary"
                    className="shipping-btn"
                  >
                    Receive order
                  </Button>
                )
              }
            </article>
          </>
        )}
      </main>
    </div>
  );
};

const ProductCard = ({
  name,
  photo,
  screen,
  ram_ssd,
  color,
  price,
  quantity,
  productId,
}: OrderItem) => (
  <div className="transaction-product-card">
    <img src={photo} alt={name} />
    <Link to={`/product/${productId}`}>{name}</Link>
    <span>{screen}</span>
    <span>{ram_ssd}</span>
    <span>{color}</span>
    <span>
      ${price} X {quantity} = ${price * quantity}
    </span>
  </div>
);

export default OrderDetails;
