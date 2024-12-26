import { CarouselButtonType, MyntraCarousel, Slider, useRating } from "6pp";
import { useEffect, useRef, useState } from "react";
import { FaTrash } from "react-icons/fa";
import {
  FaArrowLeftLong,
  FaArrowRightLong,
  FaRegStar,
  FaStar,
} from "react-icons/fa6";
import { FiEdit } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Skeleton } from "../components/loader";
import RatingsComponent from "../components/ratings";
import { ProductModel } from "../models/ProductModel";
import handleAPI from "../apis/handleAPI";
import { Button, message } from "antd";
import { authSeletor, AuthState } from "../redux/reducers/authReducer";
import { ReviewModel } from "../models/ReviewModel";
import { addToCart, CartItem } from "../redux/reducers/cartReducer";
import { Order } from "../models/OrderModel";
import { localDataNames } from "../constants/appInfos";

const ProductDetails = () => {
  const params = useParams();
  const dispatch = useDispatch();
  const auth: AuthState = useSelector(authSeletor);
  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState<ProductModel>();
  const [reviews, setReviews] = useState<ReviewModel[]>([]);
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [reviewComment, setReviewComment] = useState("");
  const reviewDialogRef = useRef<HTMLDialogElement>(null);
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [purchased, setPurchased] = useState(false);
  const [screen, setScreen] = useState("13 inch");
  const [ram_ssd, setRam_ssd] = useState("8GB - 128GB");
  const [color, setColor] = useState("Bạc");
  const navigate = useNavigate();

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

  const getAllReview = async () => {
    const api = `/product/reviews/${params.id!}`;
    try {
      const res = await handleAPI(api);
      setReviews(res.data.reviews);
      console.log(res.data);
    } catch (error: any) {
      message.error(error);
    }
  };

  const getMyOrder = async () => {
    let api = `/order/my`;
    setIsLoading(true);

    try {
      const res = await handleAPI(api);
      if (res?.data?.orders) {
        setMyOrders(res.data.orders); // Extract the products array
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

  const updatePurchasedStatus = () => {
    const found = myOrders.some((order) =>
      order.orderItems.some((item) => item.productId === params.id)
    );

    setPurchased(found);
  };

  useEffect(() => {
    getProductDetail();
    getAllReview();
    getMyOrder();
  }, []);

  useEffect(() => {
    if (myOrders.length > 0) {
      updatePurchasedStatus();
    }
  }, [myOrders]);

  const decrement = () => setQuantity((prev) => prev - 1);
  const increment = () => {
    if (product?.stock === quantity)
      return message.error(`${product?.stock} available only`);
    setQuantity((prev) => prev + 1);
  };

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

  const showDialog = () => {
    reviewDialogRef.current?.showModal();
  };

  const {
    Ratings: RatingsEditable,
    rating,
    setRating,
  } = useRating({
    IconFilled: <FaStar />,
    IconOutline: <FaRegStar />,
    value: 0,
    selectable: true,
    styles: {
      fontSize: "1.75rem",
      color: "coral",
      justifyContent: "flex-start",
    },
  });

  const reviewCloseHandler = () => {
    reviewDialogRef.current?.close();
    setRating(0);
    setReviewComment("");
  };

  const submitReview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setReviewSubmitLoading(true);
    const api = `/product/review/new/${params.id!}`;
    reviewCloseHandler();
    try {
      const res = await handleAPI(
        api,
        {
          comment: reviewComment,
          rating: rating,
        },
        "post"
      );
      getAllReview();
      getProductDetail();
      message.success(res.data.message);
    } catch (error: any) {
      message.error("Please Buy Item To Review!");
      console.log(error);
    } finally {
      setReviewSubmitLoading(false);
    }
  };

  const handleDeleteReview = async () => {};

  return (
    <div className="product-details">
      {isLoading ? (
        <ProductLoader />
      ) : (
        <>
          <main>
            <section>
              <Slider
                showThumbnails
                showNav={false}
                onClick={() => setCarouselOpen(true)}
                images={product?.photos.map((i) => i.url) || []}
              />
              {carouselOpen && (
                <MyntraCarousel
                  NextButton={NextButton}
                  PrevButton={PrevButton}
                  setIsOpen={setCarouselOpen}
                  images={product?.photos.map((i) => i.url) || []}
                />
              )}
            </section>
            <section style={{ padding: "10px 50px" }}>
              <code>{product?.category}</code>
              <h1 style={{ fontSize: "30px" }}>{product?.name}</h1>
              <em
                style={{ display: "flex", gap: "1rem", alignItems: "center" }}
              >
                <RatingsComponent value={product?.ratings || 0} />(
                {product?.numOfReviews} reviews)
              </em>
              <h3 style={{ fontSize: "18px", color: "red" }}>
                {product?.price} đ
              </h3>

              <div style={{ marginBottom: "10px" }}>
                <Button
                  style={{ marginRight: "8px" }}
                  onClick={() => setScreen("13 inch")}
                  className={screen === "13 inch" ? "selected" : ""}
                >
                  13 inch
                </Button>
                <Button
                  style={{ marginRight: "8px" }}
                  onClick={() => setScreen("14 inch")}
                  className={screen === "14 inch" ? "selected" : ""}
                >
                  14 inch
                </Button>
                <Button
                  style={{ marginRight: "8px" }}
                  onClick={() => setScreen("16 inch")}
                  className={screen === "16 inch" ? "selected" : ""}
                >
                  16 inch
                </Button>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <Button
                  style={{ marginRight: "8px" }}
                  onClick={() => setRam_ssd("8GB - 128GB")}
                  className={ram_ssd === "8GB - 128GB" ? "selected" : ""}
                >
                  8GB - 128GB
                </Button>
                <Button
                  style={{ marginRight: "8px" }}
                  onClick={() => setRam_ssd("8GB - 256GB")}
                  className={ram_ssd === "8GB - 256GB" ? "selected" : ""}
                >
                  8GB - 256GB
                </Button>
                <Button
                  style={{ marginRight: "8px" }}
                  onClick={() => setRam_ssd("16GB - 256GB")}
                  className={ram_ssd === "16GB - 256GB" ? "selected" : ""}
                >
                  16GB - 256GB
                </Button>
                <Button
                  style={{ marginRight: "8px" }}
                  onClick={() => setRam_ssd("16GB - 512GB")}
                  className={ram_ssd === "16GB - 512GB" ? "selected" : ""}
                >
                  16GB - 512GB
                </Button>
                <Button
                  style={{ marginRight: "8px" }}
                  onClick={() => setRam_ssd("32GB - 1TB")}
                  className={ram_ssd === "32GB - 1TB" ? "selected" : ""}
                >
                  32GB - 1TB
                </Button>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <Button
                  style={{ marginRight: "8px" }}
                  onClick={() => setColor("Bạc")}
                  className={color === "Bạc" ? "selected" : ""}
                >
                  Bạc
                </Button>
                <Button
                  style={{ marginRight: "8px" }}
                  onClick={() => setColor("Vàng")}
                  className={color === "Vàng" ? "selected" : ""}
                >
                  Vàng
                </Button>
                <Button
                  style={{ marginRight: "8px" }}
                  onClick={() => setColor("Đen")}
                  className={color === "Đen" ? "selected" : ""}
                >
                  Đen
                </Button>
              </div>

              <article style={{ flexDirection: "row" }}>
                <div>
                  <button onClick={decrement}>-</button>
                  <span>{quantity}</span>
                  <button onClick={increment}>+</button>
                </div>
                <button
                  style={{ width: "200px" }}
                  onClick={() =>
                    addToCartHandler({
                      _id: product?._id,
                      productId: product?._id!,
                      name: product?.name!,
                      price: product?.price!,
                      stock: product?.stock!,
                      quantity,
                      photo: product?.photos[0].url || "",
                      screen: screen,
                      ram_ssd: ram_ssd,
                      color: color,
                    })
                  }
                >
                  Add To Cart
                </button>
              </article>

              <p style={{ fontSize: "16px" }}>{product?.description}</p>
            </section>
          </main>
        </>
      )}

      <dialog ref={reviewDialogRef} className="review-dialog">
        <button onClick={reviewCloseHandler}>X</button>
        <h2>Write a Review</h2>
        <form onSubmit={submitReview}>
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Review..."
          ></textarea>
          <RatingsEditable />
          <button disabled={reviewSubmitLoading} type="submit">
            Submit
          </button>
        </form>
      </dialog>

      <section>
        <article>
          <h2>Reviews</h2>

          {auth.accessToken && purchased === true && (
            <button onClick={showDialog}>
              <FiEdit />
            </button>
          )}
        </article>
        <div
          style={{
            display: "flex",
            gap: "2rem",
            overflowX: "auto",
            padding: "2rem",
          }}
        >
          {reviews.map((review) => (
            <ReviewCard
              handleDeleteReview={handleDeleteReview}
              key={review._id}
              review={review}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

const ReviewCard = ({
  review,
  handleDeleteReview,
}: {
  review: any;
  handleDeleteReview: () => void;
}) => (
  <div className="review">
    <RatingsComponent value={review.rating} />
    <p>{review.comment}</p>
    <div>
      <img
        src="https://png.pngtree.com/png-vector/20190623/ourlarge/pngtree-accountavataruser--flat-color-icon--vector-icon-banner-templ-png-image_1491720.jpg"
        alt="User"
      />
      <small>{review.user.name}</small>
    </div>
    <button onClick={() => handleDeleteReview()}>
      <FaTrash />
    </button>
  </div>
);

const ProductLoader = () => {
  return (
    <div
      style={{
        display: "flex",
        gap: "2rem",
        border: "1px solid #f1f1f1",
        height: "80vh",
      }}
    >
      <section style={{ width: "100%", height: "100%" }}>
        <Skeleton
          width="100%"
          containerHeight="100%"
          height="100%"
          length={1}
        />
      </section>
      <section
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "4rem",
          padding: "2rem",
        }}
      >
        <Skeleton width="40%" length={3} />
        <Skeleton width="50%" length={4} />
        <Skeleton width="100%" length={2} />
        <Skeleton width="100%" length={10} />
      </section>
    </div>
  );
};

const NextButton: CarouselButtonType = ({ onClick }) => (
  <button onClick={onClick} className="carousel-btn">
    <FaArrowRightLong />
  </button>
);
const PrevButton: CarouselButtonType = ({ onClick }) => (
  <button onClick={onClick} className="carousel-btn">
    <FaArrowLeftLong />
  </button>
);

export default ProductDetails;
