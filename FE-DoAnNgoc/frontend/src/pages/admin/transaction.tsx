import { ReactElement, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Column } from "react-table";
import AdminSidebar from "../../components/admin/AdminSidebar";
import TableHOC from "../../components/admin/TableHOC";
import { Order } from "../../models/OrderModel";
import handleAPI from "../../apis/handleAPI";
import { Skeleton } from "../../components/loader";

interface DataType {
  user: string;
  amount: number;
  products: ReactElement;
  quantity: number;
  status: ReactElement;
  action: ReactElement;
}

const columns: Column<DataType>[] = [
  {
    Header: "Name",
    accessor: "user",
  },
  {
    Header: "Amount",
    accessor: "amount",
  },
  {
    Header: "Products",
    accessor: "products",
  },
  {
    Header: "Quantity",
    accessor: "quantity",
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

const Transaction = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState<DataType[]>([]);

  const getAllOrder = async () => {
    let api = "/order/all";
    setIsLoading(true);

    try {
      const res = await handleAPI(api);
      if (res?.data?.orders) {
        setOrders(res.data.orders); // Extract the products array
      } else {
        console.error("Invalid response format:", res.data);
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAllOrder();
  }, []);

  useEffect(() => {
    if (orders)
      setRows(
        orders.map((i) => ({
          user: i.user.name,
          amount: i.total,
          products: (
            <span>{i.orderItems.map((item) => item.name).join(", ")}</span>
          ),
          quantity: i.orderItems.length,
          status: (
            <span
              className={
                i.status === "Đã nhận hàng"
                  ? "green"
                  : i.status === "Đang giao hàng"
                  ? "purple"
                  : "red"
              }
            >
              {i.status}
            </span>
          ),
          action: <Link to={`/admin/transaction/${i._id}`}>Manage</Link>,
        }))
      );
  }, [orders]);

  const Table = TableHOC<DataType>(
    columns,
    rows,
    "dashboard-product-box",
    "Orders",
    rows.length > 6
  )();
  return (
    <div className="admin-container">
      <AdminSidebar />
      <main>{isLoading ? <Skeleton length={20} /> : Table}</main>
    </div>
  );
};

export default Transaction;
