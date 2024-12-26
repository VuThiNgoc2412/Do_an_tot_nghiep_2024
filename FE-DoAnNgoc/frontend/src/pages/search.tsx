import { useEffect, useState } from "react";
import ProductCard from "../components/product-card";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Button,
  Dropdown,
  Input,
  message,
  Pagination,
  Select,
  Slider,
} from "antd";
import { IoIosSearch } from "react-icons/io";
import handleAPI from "../apis/handleAPI";
import { ProductModel } from "../models/ProductModel";
import { addToCart, CartItem } from "../redux/reducers/cartReducer";
import { useDispatch } from "react-redux";
import { localDataNames } from "../constants/appInfos";

const Search = () => {
  const searchQuery = useSearchParams()[0];
  const dispatch = useDispatch();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState<ProductModel[]>([]);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [maxPrice, setMaxPrice] = useState(100000000);
  const [category, setCategory] = useState(
    searchQuery.get("category") || "Category"
  );
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const addToCartHandler = (cartItem: CartItem) => {
    const res = localStorage.getItem(localDataNames.authData);
    if (res) {
      const auth = JSON.parse(res);
      if (auth.accessToken) {
        if (cartItem.stock < 1) return message.error("Out of Stock");
        dispatch(addToCart(cartItem));
        message.success("Added to cart");
      } else {
        message.warning("You need login");
        navigate("/login");
      }
    } else {
      message.warning("You need login");
      navigate("/login");
    }
  };

  useEffect(() => {
    getAllCategories();
    getAllProduct();
  }, [search, sort, maxPrice, category, page]);

  const getAllCategories = async () => {
    try {
      const res: any = await handleAPI("/product/categories");
      const formattedCategories = res.data.categories.map((cat: string) => ({
        value: cat,
        label: cat,
      }));
      setCategories(formattedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const getAllProduct = async () => {
    let api = `/product/all?page=${page}`;

    if (maxPrice) api += `&price=${maxPrice}`;
    if (search) api += `&search=${encodeURIComponent(search)}`;
    if (sort) api += `&sort=${sort}`;
    if (category && category !== "Category")
      api += `&category=${encodeURIComponent(category)}`;

    try {
      const res = await handleAPI(api);
      if (res?.data?.products) {
        setProducts(res.data.products); // Extract the products array
      } else {
        console.error("Invalid response format:", res.data);
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    }
  };

  return (
    <div style={{ marginLeft: "40px", marginRight: "40px" }}>
      <h4>Filters</h4>
      <div style={{ display: "flex", gap: "10px" }}>
        <Select
          style={{ width: "120px" }}
          options={categories}
          value={category}
          onChange={(value) => setCategory(value)}
        />

        <Dropdown
          menu={{
            items: [
              {
                key: "1",
                label: (
                  <div style={{ width: "200px" }}>
                    <div className="d-flex">
                      <h6>100$</h6>
                      <h6 style={{ flex: "1", textAlign: "end" }}>
                        {maxPrice}$
                      </h6>
                    </div>
                    <Slider
                      defaultValue={100000}
                      min={100}
                      max={100000}
                      onChange={(value) => setMaxPrice(value)}
                    />
                  </div>
                ),
              },
            ],
          }}
          placement="bottomLeft"
          arrow
        >
          <Button>MaxPrice</Button>
        </Dropdown>

        <Button onClick={() => setSort("asc")}>Price (Low to High)</Button>
        <Button onClick={() => setSort("dsc")}>Price (High to Low)</Button>
      </div>
      <h4 style={{ marginTop: "8px", marginBottom: "20px" }}>Search</h4>
      <div>
        <Input
          prefix={<IoIosSearch />}
          placeholder="Search..."
          style={{ borderRadius: 100, width: "40%" }}
          size="middle"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div>
        {products.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "10px",
            }}
          >
            {products.map((i) => (
              <ProductCard
                key={i._id}
                productId={i._id}
                name={i.name}
                price={i.price}
                stock={i.stock}
                handler={addToCartHandler}
                photos={i.photos}
              />
            ))}
          </div>
        ) : (
          <p className="text-center mt-3 mb-3">Không có sản phẩm nào phù hợp</p>
        )}
      </div>

      <Pagination
        align="center"
        defaultCurrent={1}
        total={50}
        current={page}
        style={{ marginBottom: "20px" }}
        onChange={(currentPage) => setPage(currentPage)}
      />
    </div>
  );
};

export default Search;
