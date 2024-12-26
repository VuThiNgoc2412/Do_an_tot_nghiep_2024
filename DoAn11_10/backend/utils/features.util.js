import cloudinary from "../lib/cloudinary.js";
import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";
import Review from "../models/review.model.js";

const getBase64 = (file) =>
  `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

export const uploadToCloudinary = async (files) => {
  const promises = files.map((file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(getBase64(file), (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  });

  const results = await Promise.all(promises);

  return results.map((i) => ({
    public_id: i.public_id,
    url: i.secure_url,
  }));
};

export const deleteFromCloudinary = async (publicIds) => {
  const promises = publicIds.map((id) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(id, (error, result) => {
        if (error) return reject(error);
        resolve(result); // You might want to resolve with the result if needed
      });
    });
  });

  await Promise.all(promises);
};

export const invalidateCache = async ({
  product,
  order,
  admin,
  review,
  userId,
  orderId,
  productId,
}) => {
  if (review) {
    await redis.del(`reviews-${productId}`);
  }

  if (product) {
    const productKeys = ["latest-products", "categories", "all-products"];

    if (typeof productId === "string") {
      productKeys.push(`product-${productId}`);
    } else if (Array.isArray(productId)) {
      productId.forEach((id) => productKeys.push(`product-${id}`));
    }

    await redis.del(productKeys);
  }

  if (order) {
    const ordersKeys = [
      "all-orders",
      `my-orders-${userId}`,
      `order-${orderId}`,
    ];

    await redis.del(ordersKeys);
  }

  if (admin) {
    await redis.del([
      "admin-stats",
      "admin-pie-charts",
      "admin-bar-charts",
      "admin-line-charts",
    ]);
  }
};

export const findAverageRatings = async (productId) => {
  let totalRating = 0;

  const reviews = await Review.find({ product: productId });
  reviews.forEach((review) => {
    totalRating += review.rating;
  });

  const averateRating = Math.floor(totalRating / reviews.length) || 0;

  return {
    numOfReviews: reviews.length,
    ratings: averateRating,
  };
};

export const reduceStock = async (orderItems) => {
  for (let i = 0; i < orderItems.length; i++) {
    const order = orderItems[i];
    const product = await Product.findById(order.productId);
    if (!product) throw new Error("Product Not Found");
    product.stock -= order.quantity;
    await product.save();
  }
};
