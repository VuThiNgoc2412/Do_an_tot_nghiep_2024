import { ReactElement, useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import { Column } from "react-table";
import AdminSidebar from "../../components/admin/AdminSidebar";
import TableHOC from "../../components/admin/TableHOC";
import { Skeleton } from "../../components/loader";
import { UserModel } from "../../models/UserModel";
import handleAPI from "../../apis/handleAPI";
import { message } from "antd";

interface DataType {
  name: string;
  email: string;
  role: string;
  action: ReactElement;
}

const columns: Column<DataType>[] = [
  {
    Header: "Name",
    accessor: "name",
  },
  {
    Header: "Email",
    accessor: "email",
  },
  {
    Header: "Role",
    accessor: "role",
  },
  {
    Header: "Action",
    accessor: "action",
  },
];

const Customers = () => {
  const [rows, setRows] = useState<DataType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<UserModel[]>([]);

  const getAllUser = async () => {
    let api = `/auth/all`;
    setIsLoading(true);

    try {
      const res = await handleAPI(api);
      if (res?.data?.user) {
        setUsers(res.data.user); // Extract the products array
      } else {
        console.error("Invalid response format:", res.data);
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAllUser();
  }, []);

  const deleteHandler = async (_id: string) => {
    let api = `/auth/${_id}`;
    try {
      const res = await handleAPI(api, [], "delete");
      message.success(res.data.message);
      getAllUser();
    } catch (error) {
      console.error("Error delete products:", error);
    }
  };

  useEffect(() => {
    if (users)
      setRows(
        users.map((i) => ({
          name: i.name,
          email: i.email,
          role: i.role,
          action: (
            <button onClick={() => deleteHandler(i._id)}>
              <FaTrash />
            </button>
          ),
        }))
      );
  }, [users]);

  const Table = TableHOC<DataType>(
    columns,
    rows,
    "dashboard-product-box",
    "Customers",
    rows.length > 6
  )();

  return (
    <div className="admin-container">
      <AdminSidebar />
      <main>{isLoading ? <Skeleton length={20} /> : Table}</main>
    </div>
  );
};

export default Customers;
