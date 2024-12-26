export type Order = {
  orderItems: OrderItem[];
  shippingInfo: ShippingInfo;
  subtotal: number;
  tax: number;
  shippingCharges: number;
  discount: number;
  total: number;
  status: string;
  user: {
    name: string;
    _id: string;
  };
  _id: string;
};

export interface OrderItem {
  name: string;
  photo: string;
  screen: string;
  ram_ssd: string;
  color: string;
  price: number;
  quantity: number;
  productId: string;
  _id: string;
}

export interface ShippingInfo {
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
}

export interface OrderRequest {
  shippingInfo: ShippingInfo;
  subtotal: number;
  shippingCharges: number;
  tax: number;
  discount: number;
  total: number;
  orderItems: OrderItem[];
}
