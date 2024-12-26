import { useEffect, useState } from "react";

import CartItemComponent from "../components/cart-item";
import { Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  calculatePrice,
  CartItem,
  CartReducerInitialState,
  cartSeletor,
  discountApplied,
  removeCartItem,
} from "../redux/reducers/cartReducer";
import handleAPI from "../apis/handleAPI";

const Cart = () => {
  const cartData: CartReducerInitialState = useSelector(cartSeletor);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState<string>("");
  const [isValidCouponCode, setIsValidCouponCode] = useState<boolean>(false);

  const incrementHandler = (cartItem: CartItem) => {
    if (cartItem.quantity >= cartItem.stock) {
      message.error("Out of stock");
      return;
    }

    dispatch(addToCart({ ...cartItem, quantity: cartItem.quantity + 1 }));
  };
  const decrementHandler = (cartItem: CartItem) => {
    if (cartItem.quantity <= 1) return;

    dispatch(addToCart({ ...cartItem, quantity: cartItem.quantity - 1 }));
  };
  const removeHandler = (productId: string) => {
    dispatch(removeCartItem(productId));
  };

  useEffect(() => {
    const timeOutID = setTimeout(async () => {
      try {
        const res: any = await handleAPI(
          `/payment/discount?coupon=${couponCode}`
        );
        dispatch(discountApplied(res.data.discount));
        dispatch(calculatePrice());
        setIsValidCouponCode(true);
      } catch (error: any) {
        dispatch(discountApplied(0));
        setIsValidCouponCode(false);
        dispatch(calculatePrice());
      }
    }, 1000);
  }, [couponCode]);

  useEffect(() => {
    dispatch(calculatePrice());
  }, [cartData.cartItems]);

  return (
    <div className="cart">
      <main>
        {cartData.cartItems.length > 0 ? (
          cartData.cartItems.map((i, idx) => (
            <CartItemComponent
              incrementHandler={incrementHandler}
              decrementHandler={decrementHandler}
              removeHandler={removeHandler}
              key={idx}
              cartItem={i}
            />
          ))
        ) : (
          <h1>No Items Added</h1>
        )}
      </main>
      <aside>
        <p>Subtotal: ${cartData.subtotal}</p>
        <p>Shipping Charges: ${cartData.shippingCharges}</p>
        <p>Tax: ${cartData.tax}</p>
        <p>
          Discount: <em className="red"> - ${cartData.discount}</em>
        </p>
        <p>
          <b>Total: ${cartData.total}</b>
        </p>

        {cartData.cartItems.length > 0 && (
          <Button type="primary" onClick={() => navigate("/shipping")}>
            Check out
          </Button>
        )}
      </aside>
    </div>
  );
};

export default Cart;
