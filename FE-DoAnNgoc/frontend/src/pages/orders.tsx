import { ReactElement, useEffect, useState } from "react";
import { Column } from "react-table";
import TableHOC from "../components/admin/TableHOC";
import { Skeleton } from "../components/loader";
import { Order } from "../models/OrderModel";
import handleAPI from "../apis/handleAPI";
import { Link } from "react-router-dom";
import { FaEye } from "react-icons/fa";

type DataType = {
  name: string; // Tên của sản phẩm
  _id: string;
  amount: number;
  quantity: number;
  discount: number;
  status: ReactElement;
  action: ReactElement;
};

const column: Column<DataType>[] = [
  {
    Header: "Name",
    accessor: "name",
  },
  {
    Header: "Quantity",
    accessor: "quantity",
  },
  {
    Header: "Discount",
    accessor: "discount",
  },
  {
    Header: "Amount",
    accessor: "amount",
  },
  {
    Header: "Status",
    accessor: "status",
  },
  {
    Header: "Action",
    accessor: "action",
  },
];

const Orders = () => {
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState<DataType[]>([]);

  const getMyOrder = async () => {
    let api = "/order/my";
    setIsLoading(true);

    try {
      const res = await handleAPI(api);
      if (res?.data?.orders) {
        setMyOrders(res.data.orders); // Lưu danh sách đơn hàng
      } else {
        console.error("Invalid response format:", res.data);
        setMyOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setMyOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getMyOrder();
  }, []);

  useEffect(() => {
    if (myOrders)
      setRows(
        myOrders.map((order) => ({
          name: order.orderItems
            .map((item) => item.name) // Gộp tên các sản phẩm
            .join(", "),
          _id: order._id,
          amount: order.total,
          discount: order.discount,
          quantity: order.orderItems.length,
          status: (
            <span
              className={
                order.status === "Đã nhận hàng"
                  ? "green"
                  : order.status === "Đang giao hàng"
                  ? "purple"
                  : "red"
              }
            >
              {order.status}
            </span>
          ),
          action: (
            <Link to={`/order/${order._id}`}>
              <FaEye />
            </Link>
          ),
        }))
      );
  }, [myOrders]);

  const Table = TableHOC<DataType>(
    column,
    rows,
    "dashboard-product-box",
    "Orders",
    rows.length > 6
  )();

  return (
    <div className="container">
      <h1>My Orders</h1>
      {isLoading ? <Skeleton length={20} /> : Table}
    </div>
  );
};

export default Orders;
