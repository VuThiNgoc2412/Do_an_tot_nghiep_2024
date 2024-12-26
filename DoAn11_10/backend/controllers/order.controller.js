import { redis } from "../lib/redis.js";
import Order from "../models/order.model.js";
import { invalidateCache, reduceStock } from "../utils/features.util.js";

export const createOrder = async (req, res) => {
  try {
    const {
      shippingInfo,
      orderItems,
      subtotal,
      tax,
      shippingCharges,
      discount,
      total,
    } = req.body;

    const user = req.user;

    // Kiểm tra xem tất cả các trường cần thiết có được cung cấp không
    if (!shippingInfo || !orderItems || !subtotal || !tax || !total)
      return res.status(400).json({ message: "Please add All Fields" });

    // Tạo đơn hàng mới trong cơ sở dữ liệu
    const order = await Order.create({
      shippingInfo,
      orderItems,
      user,
      subtotal,
      tax,
      shippingCharges,
      discount,
      total,
    });

    // Giảm số lượng hàng tồn kho cho các sản phẩm trong đơn hàng
    await reduceStock(orderItems);

    // Vô hiệu hóa bộ nhớ cache cho các sản phẩm, đơn hàng, admin và người dùng
    await invalidateCache({
      product: true,
      order: true,
      admin: true,
      userId: user._id,
      productId: order.orderItems.map((i) => String(i.productId)),
    });

    // Trả về phản hồi thành công
    res.status(201).json({ message: "Order Created Successfully" });
  } catch (error) {
    console.log("Error in createOrder controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const myOrders = async (req, res) => {
  try {
    const user = req.user;
    const key = `my-orders-${user._id}`;

    let orders;

    orders = await redis.get(key);

    if (orders) orders = JSON.parse(orders);
    else {
      orders = await Order.find({ user });
      await redis.set(key, JSON.stringify(orders));
    }
    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.log("Error in myOrder controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const allOrders = async (req, res) => {
  try {
    const key = `all-orders`;

    let orders;

    orders = await redis.get(key);

    if (orders) orders = JSON.parse(orders);
    else {
      orders = await Order.find().populate("user", "name");
      await redis.set(key, JSON.stringify(orders));
    }
    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.log("Error in allOrder controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getSingleOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user; // The user making the request
    const key = `order-${id}`;

    let order;
    order = await redis.get(key);

    if (order) {
      order = JSON.parse(order);
    } else {
      order = await Order.findById(id).populate("user", "name");

      if (!order) {
        return res.status(400).json({ message: "Order Not Found" });
      }

      // Cache the order for future requests
      await redis.set(key, JSON.stringify(order));
    }

    // Check if the user is authorized to access the order
    if (
      order.user._id.toString() !== user._id.toString() &&
      user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to access this order" });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.log("Error in getSingleOrder controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const processOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) return next(new ErrorHandler("Order Not Found", 404));

    switch (order.status) {
      case "Chờ xác nhận":
        order.status = "Đang giao hàng";
        break;
    }

    await order.save();

    await invalidateCache({
      product: false,
      order: true,
      admin: true,
      userId: order.user,
      orderId: String(order._id),
    });

    res.status(200).json({ message: "Order Processed Successfully" });
  } catch (error) {
    console.log("Error in processOrder controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user; // The user making the request

    const order = await Order.findById(id);

    if (!order) return res.status(400).json({ message: "Order Not Found" });

    if (
      order.user._id.toString() !== user._id.toString() &&
      user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to access this order" });
    } else {
      order.status = "Đã huỷ";
    }

    await order.save();

    await invalidateCache({
      product: false,
      order: true,
      admin: true,
      userId: order.user,
      orderId: String(order._id),
    });

    res.status(200).json({ message: "Order cancelOrder Successfully" });
  } catch (error) {
    console.log("Error in cancelOrder controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const receiveOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user; // The user making the request

    const order = await Order.findById(id);

    if (!order) return res.status(400).json({ message: "Order Not Found" });

    if (
      order.user._id.toString() !== user._id.toString() &&
      user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to access this order" });
    } else {
      order.status = "Đã nhận hàng";
    }

    await order.save();

    await invalidateCache({
      product: false,
      order: true,
      admin: true,
      userId: order.user,
      orderId: String(order._id),
    });

    res.status(200).json({ message: "Order receiveOrder Successfully" });
  } catch (error) {
    console.log("Error in receiveOrder controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) return res.status(400).json({ message: "Order Not Found" });

    await order.deleteOne();

    await invalidateCache({
      product: false,
      order: true,
      admin: true,
      userId: order.user,
      orderId: String(order._id),
    });
    res.status(200).json({ message: "Order deleteOrder Successfully" });
  } catch (error) {
    console.log("Error in deleteOrder controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
