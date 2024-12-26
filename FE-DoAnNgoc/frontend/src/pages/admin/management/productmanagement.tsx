import { useFileHandler } from "6pp";
import { FormEvent, useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import AdminSidebar from "../../../components/admin/AdminSidebar";
import { Skeleton } from "../../../components/loader";
import { transformImage } from "../../../utils/features";
import { ProductModel } from "../../../models/ProductModel";
import handleAPI from "../../../apis/handleAPI";
import { Button, message, Modal, Spin } from "antd";

const Productmanagement = () => {
  const params = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState<ProductModel>();

  const getProductDetail = async () => {
    const api = `/product/${params.id!}`;
    setIsLoading(true);
    try {
      const res = await handleAPI(api);
      setProduct(res.data.product);
    } catch (error: any) {
      message.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getProductDetail();
  }, []);

  const { price, photos, name, stock, category, description } = product || {
    photos: [],
    category: "",
    name: "",
    stock: 0,
    price: 0,
    description: "",
  };

  const [btnLoading, setBtnLoading] = useState<boolean>(false);
  const [btnLoadingDelete, setBtnLoadingDelete] = useState<boolean>(false);
  const [priceUpdate, setPriceUpdate] = useState<number>(price);
  const [stockUpdate, setStockUpdate] = useState<number>(stock);
  const [nameUpdate, setNameUpdate] = useState<string>(name);
  const [categoryUpdate, setCategoryUpdate] = useState<string>(category);
  const [descriptionUpdate, setDescriptionUpdate] =
    useState<string>(description);

  const photosFiles = useFileHandler("multiple", 10, 5);

  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setBtnLoading(true);
    try {
      const formData = new FormData();
      const api = `/product/${params.id!}`;

      if (nameUpdate) formData.set("name", nameUpdate);
      if (descriptionUpdate) formData.set("description", descriptionUpdate);
      if (priceUpdate) formData.set("price", priceUpdate.toString());
      if (stockUpdate !== undefined)
        formData.set("stock", stockUpdate.toString());

      if (categoryUpdate) formData.set("category", categoryUpdate);

      if (photosFiles.file && photosFiles.file.length > 0) {
        photosFiles.file.forEach((file) => {
          formData.append("photos", file);
        });
      }
      const res: any = await handleAPI(api, formData, "put");
      navigate("/admin/product");
      message.success(res.data.message);
    } catch (error) {
      console.log(error);
    } finally {
      setBtnLoading(false);
    }
  };

  const deleteHandler = () => {
    // Hiển thị pop-up xác nhận
    Modal.confirm({
      title: "Xác nhận xoá đơn hàng",
      content:
        "Bạn có chắc chắn muốn xoá đơn hàng này? Hành động này không thể hoàn tác.",
      okText: "Xoá",
      cancelText: "Hủy",
      okType: "danger", // Nút 'Xoá' sẽ có màu đỏ
      onOk: async () => {
        setBtnLoadingDelete(true); // Set loading khi bắt đầu xóa
        try {
          const api = `/product/${params.id!}`;
          const res = await handleAPI(api, [], "delete"); // Gọi API để xóa đơn hàng
          message.success(res.data.message);
          navigate("/admin/product"); // Sau khi xóa, điều hướng về trang danh sách đơn hàng
        } catch (error: any) {
          message.error(error);
        } finally {
          setBtnLoadingDelete(false); // Set lại trạng thái loading khi hoàn thành
        }
      },
      onCancel: () => {
        message.info("Đã huỷ xoá đơn hàng.");
      },
    });
  };

  useEffect(() => {
    if (product) {
      setNameUpdate(product.name);
      setPriceUpdate(product.price);
      setStockUpdate(product.stock);
      setCategoryUpdate(product.category);
      setDescriptionUpdate(product.description);
    }
  }, [product]);

  return (
    <div className="admin-container">
      <AdminSidebar />
      <main className="product-management">
        {isLoading ? (
          <Skeleton length={20} />
        ) : (
          <>
            <section>
              <strong>ID - {product?._id}</strong>
              <img
                src={
                  photos?.[0]?.url
                    ? transformImage(photos?.[0]?.url, 400)
                    : "/placeholder-image.jpg"
                }
                alt={name || "Product Image"}
              />
              <p>{name}</p>
              {stock > 0 ? (
                <span className="green">{stock} Available</span>
              ) : (
                <span className="red"> Not Available</span>
              )}
              <h3>${price}</h3>
            </section>
            <article>
              <button
                className="product-delete-btn"
                onClick={deleteHandler} // Gọi hàm deleteHandler khi người dùng nhấn nút
                disabled={btnLoadingDelete} // Disable nút khi đang xóa
              >
                {btnLoadingDelete ? <Spin size="small" /> : <FaTrash />}
              </button>
              <form onSubmit={submitHandler} className="update_form">
                <h2>Manage</h2>
                <div>
                  <label
                    style={{
                      fontWeight: "600",
                      fontSize: "18px",
                    }}
                  >
                    Name
                  </label>
                  <input
                    style={{ marginTop: "10px" }}
                    type="text"
                    placeholder="Name"
                    value={nameUpdate}
                    onChange={(e) => setNameUpdate(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontWeight: "600",
                      fontSize: "18px",
                    }}
                  >
                    Description
                  </label>
                  <textarea
                    style={{
                      width: "100%",
                      padding: "10px",
                      marginTop: "10px",
                      border: "1px solid #cccccc",
                      borderRadius: "5px",
                    }}
                    required
                    placeholder="Description"
                    value={descriptionUpdate}
                    onChange={(e) => setDescriptionUpdate(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontWeight: "600",
                      fontSize: "18px",
                    }}
                  >
                    Price
                  </label>
                  <input
                    style={{ marginTop: "10px" }}
                    type="number"
                    placeholder="Price"
                    value={priceUpdate}
                    onChange={(e) => setPriceUpdate(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontWeight: "600",
                      fontSize: "18px",
                    }}
                  >
                    Stock
                  </label>
                  <input
                    style={{ marginTop: "10px" }}
                    type="number"
                    placeholder="Stock"
                    value={stockUpdate}
                    onChange={(e) => setStockUpdate(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontWeight: "600",
                      fontSize: "18px",
                    }}
                  >
                    Category
                  </label>
                  <input
                    style={{ marginTop: "10px" }}
                    type="text"
                    placeholder="eg. laptop, camera etc"
                    value={categoryUpdate}
                    onChange={(e) => setCategoryUpdate(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontWeight: "600",
                      fontSize: "18px",
                    }}
                  >
                    Photos
                  </label>
                  <input
                    style={{ marginTop: "10px" }}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={photosFiles.changeHandler}
                  />
                </div>

                {photosFiles.error && <p>{photosFiles.error}</p>}

                {photosFiles.preview && (
                  <div
                    style={{ display: "flex", gap: "1rem", overflowX: "auto" }}
                  >
                    {photosFiles.preview.map((img, i) => (
                      <img
                        style={{ width: 50, height: 50, objectFit: "cover" }}
                        key={i}
                        src={img}
                        alt="New Image"
                      />
                    ))}
                  </div>
                )}

                <Button
                  style={{ marginBottom: "30px" }}
                  type="primary"
                  htmlType="submit"
                  disabled={btnLoading}
                  loading={btnLoading}
                >
                  Update
                </Button>
              </form>
            </article>
          </>
        )}
      </main>
    </div>
  );
};

export default Productmanagement;
