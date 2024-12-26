import { FaTrash } from "react-icons/fa";
import { Link } from "react-router-dom";
import { transformImage } from "../utils/features";
import { CartItem } from "../redux/reducers/cartReducer";
import { Button } from "antd";

type CartItemProps = {
  cartItem: CartItem;
  incrementHandler: (cartItem: CartItem) => void;
  decrementHandler: (cartItem: CartItem) => void;
  removeHandler: (id: string) => void;
};

const CartItemComponent = ({
  cartItem,
  incrementHandler,
  decrementHandler,
  removeHandler,
}: CartItemProps) => {
  const { photo, productId, name, price, quantity, screen, ram_ssd, color } =
    cartItem;

  return (
    <div className="cart-item">
      <img src={transformImage(photo)} alt={name} />
      <article>
        <Link to={`/product/${productId}`}>{name}</Link>
        <span>${price}</span>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button>{screen}</Button>
          <Button>{ram_ssd}</Button>
          <Button>{color}</Button>
        </div>
      </article>

      <div>
        <button onClick={() => decrementHandler(cartItem)}>-</button>
        <p>{quantity}</p>
        <button onClick={() => incrementHandler(cartItem)}>+</button>
      </div>

      <button onClick={() => removeHandler(productId)}>
        <FaTrash />
      </button>
    </div>
  );
};

export default CartItemComponent;
