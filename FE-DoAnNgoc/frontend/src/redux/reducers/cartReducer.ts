import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CartReducerInitialState {
  cartItems: CartItem[];
  subtotal: number;
  tax: number;
  shippingCharges: number;
  discount: number;
  total: number;
  shippingInfo: ShippingInfo;
  coupon: string | undefined;
}

export type ShippingInfo = {
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
};

export type CartItem = {
  _id?: string;
  productId: string;
  photo: string;
  name: string;
  screen: string;
  ram_ssd: string;
  color: string;
  price: number;
  quantity: number;
  stock: number;
};

const initialState: CartReducerInitialState = {
  cartItems: [],
  subtotal: 0,
  tax: 0,
  shippingCharges: 0,
  discount: 0,
  total: 0,
  coupon: undefined,
  shippingInfo: {
    address: "",
    city: "",
    state: "",
    country: "",
    pinCode: "",
  },
};

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    data: initialState,
  },
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const index = state.data.cartItems.findIndex(
        (i) => i.productId === action.payload.productId
      );

      if (index !== -1) state.data.cartItems[index] = action.payload;
      else state.data.cartItems.push(action.payload);
    },

    removeCartItem: (state, action: PayloadAction<string>) => {
      state.data.cartItems = state.data.cartItems.filter(
        (i) => i.productId !== action.payload
      );
    },

    calculatePrice: (state) => {
      const subtotal = state.data.cartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      state.data.subtotal = subtotal;
      state.data.shippingCharges = state.data.subtotal > 1000 ? 0 : 200;
      state.data.tax = Math.round(state.data.subtotal * 0.18);
      state.data.total =
        state.data.subtotal +
        state.data.tax +
        state.data.shippingCharges -
        state.data.discount;
    },

    discountApplied: (state, action: PayloadAction<number>) => {
      state.data.discount = action.payload;
    },

    saveCoupon: (state, action: PayloadAction<string>) => {
      state.data.coupon = action.payload;
    },
    saveShippingInfo: (state, action: PayloadAction<ShippingInfo>) => {
      state.data.shippingInfo = action.payload;
    },
    resetCart: (state) => {
      state.data = initialState;
    },
  },
});

export const cartReducer = cartSlice.reducer;
export const {
  addToCart,
  removeCartItem,
  calculatePrice,
  discountApplied,
  saveCoupon,
  saveShippingInfo,
  resetCart,
} = cartSlice.actions;
export const cartSeletor = (state: any) => state.cartReducer.data;
