import { redis } from "../lib/redis.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Review from "../models/review.model.js";
import {
  deleteFromCloudinary,
  findAverageRatings,
  invalidateCache,
  uploadToCloudinary,
} from "../utils/features.util.js";
import cosineSimilarity from "compute-cosine-similarity";

export const createProduct = async (req, res) => {
  try {
    const { name, price, stock, category, description } = req.body;

    const photos = req.files;

    if (!photos) return res.status(400).json({ message: "Please add Photo" });

    if (photos.length < 1)
      return res.status(400).json({ message: "Please add atleast one Photo" });

    if (photos.length > 5)
      return res.status(400).json({ message: "You can only upload 5 Photos" });

    if (!name || !price || !stock || !category || !description)
      return res.status(400).json({ message: "Please enter All Fields" });

    const checkNameProduct = await Product.findOne({
      name: name,
    });

    if (checkNameProduct !== null)
      return res.status(400).json({ message: "The name is already" });

    // Upload Here
    const photosURL = await uploadToCloudinary(photos);

    await Product.create({
      name,
      price,
      description,
      stock,
      category,
      photos: photosURL,
    });

    await invalidateCache({ product: true, admin: true });

    res.status(201).json({ message: "Product Created Successfully" });
  } catch (error) {
    console.log("Error in createProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock, category, description } = req.body;
    const photos = req.files;

    const product = await Product.findById(id);

    if (!product) return next(new ErrorHandler("Product Not Found", 404));

    if (photos && photos.length > 0) {
      const photosURL = await uploadToCloudinary(photos);

      const ids = product.photos.map((photo) => photo.public_id);

      await deleteFromCloudinary(ids);

      product.photos = photosURL;
    }

    if (name) product.name = name;
    if (price) product.price = price;
    if (stock) product.stock = stock;
    if (category) product.category = category;
    if (description) product.description = description;

    await product.save();

    await invalidateCache({
      product: true,
      productId: String(product._id),
      admin: true,
    });

    res.status(200).json({ message: "Product update Successfully" });
  } catch (error) {
    console.log("Error in updateProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return next(new ErrorHandler("Product Not Found", 404));

    const ids = product.photos.map((photo) => photo.public_id);

    await deleteFromCloudinary(ids);

    await product.deleteOne();

    await invalidateCache({
      product: true,
      productId: String(product._id),
      admin: true,
    });

    res.status(200).json({ message: "Product delete Successfully" });
  } catch (error) {
    console.log("Error in deleteProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getSingleProduct = async (req, res) => {
  try {
    let product;
    const id = req.params.id;
    const key = `product-${id}`;

    product = await redis.get(key);
    if (product) product = JSON.parse(product);
    else {
      product = await Product.findById(id);
      if (!product) return next(new ErrorHandler("Product Not Found", 404));

      await redis.set(key, JSON.stringify(product));
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.log("Error in getSingleProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    let categories;

    categories = await redis.get("categories");

    if (categories) categories = JSON.parse(categories);
    else {
      categories = await Product.distinct("category");
      await redis.set("categories", JSON.stringify(categories));
    }

    res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    console.log("Error in getAllCategories controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const { search, category, price, sort, page = 1, limit = 8 } = req.query;

    // Parse filters
    const filters = {};
    if (search) filters.name = { $regex: search, $options: "i" }; // Case-insensitive search
    if (category) filters.category = category;
    if (price) filters.price = { $lte: Number(price) }; // Ensure maxPrice is a number

    console.log("Filters applied:", filters);

    // Base query
    let query = Product.find(filters);

    // Sorting
    if (sort === "asc") query = query.sort({ price: 1 });
    else if (sort === "dsc") query = query.sort({ price: -1 });

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    query = query.skip(skip).limit(Number(limit));

    // Execute query
    const products = await query.exec();

    // Total count for pagination
    const totalProducts = await Product.countDocuments(filters);

    return res.status(200).json({
      success: true,
      products,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// export const createReview = async (req, res) => {
//   try {
//     const user = req.user;

//     const product = await Product.findById(req.params.id);
//     if (!product) return res.status(400).json({ message: "Product Not Found" });

//     const { comment, rating } = req.body;

//     const alreadyReviewed = await Review.findOne({
//       user: user._id,
//       product: product._id,
//     });

//     if (alreadyReviewed) {
//       alreadyReviewed.comment = comment;
//       alreadyReviewed.rating = rating;

//       await alreadyReviewed.save();
//     } else {
//       await Review.create({
//         comment,
//         rating,
//         user: user._id,
//         product: product._id,
//       });
//     }

//     const { ratings, numOfReviews } = await findAverageRatings(product._id);

//     product.ratings = ratings;
//     product.numOfReviews = numOfReviews;

//     await product.save();

//     await invalidateCache({
//       product: true,
//       productId: String(product._id),
//       admin: true,
//       review: true,
//     });

//     res.status(alreadyReviewed ? 200 : 201).json({
//       success: true,
//       message: alreadyReviewed ? "Review Update" : "Review Added",
//     });
//   } catch (error) {
//     console.log("Error in getAllProducts controller", error.message);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

export const createReview = async (req, res) => {
  try {
    const user = req.user;

    // Tìm sản phẩm theo ID
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(400).json({ message: "Product Not Found" });

    const { comment, rating } = req.body;

    // Thêm logic kiểm tra vào hàm createReview
    const hasPurchased = await Order.findOne({
      user: user._id, // Người dùng
      "orderItems.productId": product._id, // Sản phẩm
      status: "Đã nhận hàng", // Đảm bảo trạng thái đơn hàng là "Đã nhận hàng"
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message:
          "You can only review products you have purchased and received.",
      });
    }

    // Kiểm tra nếu đã review trước đó
    const alreadyReviewed = await Review.findOne({
      user: user._id,
      product: product._id,
    });

    if (alreadyReviewed) {
      alreadyReviewed.comment = comment;
      alreadyReviewed.rating = rating;

      await alreadyReviewed.save();
    } else {
      await Review.create({
        comment,
        rating,
        user: user._id,
        product: product._id,
      });
    }

    // Tính toán lại ratings và số lượng review
    const { ratings, numOfReviews } = await findAverageRatings(product._id);

    product.ratings = ratings;
    product.numOfReviews = numOfReviews;

    await product.save();

    // Invalidate cache nếu cần
    await invalidateCache({
      product: true,
      productId: String(product._id),
      admin: true,
      review: true,
    });

    res.status(alreadyReviewed ? 200 : 201).json({
      success: true,
      message: alreadyReviewed ? "Review Updated" : "Review Added",
    });
  } catch (error) {
    console.log("Error in createReview controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const allReviewsOfProduct = async (req, res) => {
  try {
    let reviews;
    const key = `reviews-${req.params.id}`;

    reviews = await redis.get(key);

    if (reviews) reviews = JSON.parse(reviews);
    else {
      reviews = await Review.find({
        product: req.params.id,
      })
        .populate("user", "name")
        .sort({ updatedAt: -1 });

      await redis.set(key, JSON.stringify(reviews));
    }

    res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.log("Error in getAllProducts controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAdminProducts = async (req, res) => {
  try {
    let products;

    products = await Product.find({});

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.log("Error in getAdminProducts controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const recommend = async (req, res) => {
  try {
    // content based
    const user = req.user;
    // 1. Lấy tất cả đơn hàng của user
    const orders = await Order.find({ user }).lean();
    // 2. Lấy toàn bộ sản phẩm từ database
    const allProducts = await Product.find({}).lean();
    // 3. Tạo Set chứa productId của các sản phẩm đã mua
    const purchasedProductIds = new Set();
    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        if (item.productId) {
          purchasedProductIds.add(item.productId.toString());
        }
      });
    });
    // console.log("purchasedProductIds", purchasedProductIds);

    // 4. Sắp xếp allProducts: Đưa sản phẩm đã mua lên đầu
    const sortedAllProducts = allProducts.sort((a, b) => {
      const aIsPurchased = purchasedProductIds.has(a._id.toString());
      const bIsPurchased = purchasedProductIds.has(b._id.toString());

      return bIsPurchased - aIsPurchased; // true -> lên đầu
    });
    // console.log("sortedAllProducts", sortedAllProducts);

    // 5. Lấy toàn bộ category từ database
    let allCategory = await Product.distinct("category");
    // console.log("allCategory", allCategory);

    let productMatrix = Array.from({ length: sortedAllProducts.length }, () =>
      Array(allCategory.length).fill(0)
    );

    for (let i = 0; i < sortedAllProducts.length; i++) {
      for (let j = 0; j < allCategory.length; j++) {
        if (sortedAllProducts[i].category === allCategory[j]) {
          productMatrix[i][j] = 1;
        }
      }
    }

    // console.log("productMatrix:", productMatrix);
    // console.log("productMatrixLength", productMatrix.length);

    // Khởi tạo ma trận rỗng cho sản phẩm đã mua và chưa mua
    let productMatrixPurchased = [];
    let productMatrixNotPurchased = [];

    // Phân loại sản phẩm dựa trên purchasedProductIds
    for (let i = 0; i < productMatrix.length; i++) {
      if (i < purchasedProductIds.size) {
        // Dòng tương ứng với sản phẩm đã mua
        productMatrixPurchased.push(productMatrix[i]);
      } else {
        // Dòng tương ứng với sản phẩm chưa mua
        productMatrixNotPurchased.push(productMatrix[i]);
      }
    }

    // console.log("productMatrixPurchased:", productMatrixPurchased);
    // console.log("productMatrixNotPurchased:", productMatrixNotPurchased);

    // userMatrix
    let vectorSum = Array(productMatrixPurchased[0].length).fill(0);
    // Cộng tất cả các vector lại
    productMatrixPurchased.forEach((vector) => {
      for (let i = 0; i < vector.length; i++) {
        vectorSum[i] += vector[i];
      }
    });

    // Bước 3: Tính trung bình bằng cách chia tổng cho số lượng vector
    let userMatrix = vectorSum.map(
      (sum) => sum / productMatrixPurchased.length
    );

    console.log("userMatrix", userMatrix);

    // Bước 1: Tính weighted vector bằng cách nhân vector với độ tương đồng
    let weightedVectors = productMatrixNotPurchased.map((vector) => {
      let similarity = cosineSimilarity(userMatrix, vector);

      // Nhân từng phần tử trong vector với similarity
      return vector.map((value) => value * similarity);
    });

    // Bước 2: Cộng tất cả các weighted vector lại thành 1 vector kết quả
    let similarities = weightedVectors.reduce((sumVector, currentVector) => {
      return sumVector.map((value, index) => value + currentVector[index]);
    });

    console.log("similarities", similarities);

    // Lọc cộng tác
    let allUsers = await User.find({}).lean();
    let allReviews = await Review.find({}).lean();

    const userProductMatrix = Array.from({ length: allUsers.length }, () =>
      Array(sortedAllProducts.length).fill(0)
    );

    // Lọc đánh giá và điền vào ma trận
    for (let review of allReviews) {
      // Tìm chỉ số người dùng và sản phẩm tương ứng trong ma trận
      let userIndex = allUsers.findIndex(
        (user) => user._id.toString() === review.user.toString()
      );
      let productIndex = sortedAllProducts.findIndex(
        (product) => product._id.toString() === review.product.toString()
      );

      // Nếu tìm thấy người dùng và sản phẩm, điền số sao vào ma trận
      if (userIndex !== -1 && productIndex !== -1) {
        userProductMatrix[userIndex][productIndex] = review.rating;
      }
    }
    console.log("userProductMatrix", userProductMatrix);

    // Tìm vị trí của user đang login
    const loggedInUserIndex = allUsers.findIndex(
      (user) => user._id.toString() === user._id.toString()
    );

    if (loggedInUserIndex === -1) {
      console.log("User đang login không tồn tại trong danh sách allUsers");
    }

    // Tính similarity giữa người dùng đăng nhập và các người dùng khác
    const similaritiesUserProduct = userProductMatrix.map(
      (userVector, userIndex) => {
        if (userIndex === loggedInUserIndex) return 0; // Similarity với chính mình là 0 (hoặc 1 nếu muốn)

        // Điều chỉnh các vector: nếu tại một vị trí nào đó của người dùng đăng nhập là 0, thì thay 0 vào vector của người khác tại vị trí đó
        let adjustedLoggedInUserVector = [
          ...userProductMatrix[loggedInUserIndex],
        ]; // Sao chép vector của người dùng đăng nhập
        let adjustedUserVector = [...userVector]; // Sao chép vector của user khác

        for (let i = 0; i < adjustedLoggedInUserVector.length; i++) {
          if (adjustedLoggedInUserVector[i] === 0) {
            adjustedUserVector[i] = 0; // Đặt giá trị của user khác thành 0 nếu người dùng đăng nhập có giá trị 0 tại vị trí đó
          }
        }

        // Tính similarity giữa hai vector đã điều chỉnh
        return cosineSimilarity(adjustedLoggedInUserVector, adjustedUserVector);
      }
    );
    console.log("similaritiesUserProduct", similaritiesUserProduct);

    // Tạo mảng các index và giá trị similarity
    let indexedSimilarities = similaritiesUserProduct.map((value, index) => ({
      index,
      value,
    }));
    // Sắp xếp mảng theo giá trị similarity giảm dần
    indexedSimilarities.sort((a, b) => b.value - a.value);
    // Lấy 3 index có giá trị lớn nhất
    let top3Indexes = indexedSimilarities.slice(0, 3).map((item) => item.index);
    console.log("Top 3 indexes with the highest similarity:", top3Indexes);

    console.log("vectorUserLogin", userProductMatrix[loggedInUserIndex]);

    //Thay thế vị trí bằng 0 trong vectorUserLogin
    // Duyệt qua vectorUserLogin và thay thế các giá trị bằng tổng từ các vector tương ứng
    for (let i = 0; i < userProductMatrix[loggedInUserIndex].length; i++) {
      if (userProductMatrix[loggedInUserIndex][i] === 0) {
        // Nếu giá trị tại vị trí i là 0
        let sum = 0;
        // Duyệt qua các chỉ số của người dùng trong top3Indexes và cộng các giá trị tương ứng
        for (let j = 0; j < top3Indexes.length; j++) {
          sum += userProductMatrix[top3Indexes[j]][i]; // Lấy giá trị tại vị trí i của user từ top3Indexes
        }
        userProductMatrix[loggedInUserIndex][i] = sum / (3 * 5); // Thay giá trị của vị trí i trong vectorUserLogin bằng tổng
      }
    }
    console.log(
      "Updated vectorUserLogin:",
      userProductMatrix[loggedInUserIndex]
    );
    //lấy ra vector các sp userlogin chưa
    let vectorUserLoginProductNotPurchased = [];
    for (let i = 0; i < userProductMatrix[loggedInUserIndex].length; i++) {
      if (i >= purchasedProductIds.size) {
        vectorUserLoginProductNotPurchased.push(
          userProductMatrix[loggedInUserIndex][i]
        );
      }
    }
    console.log(
      "vectorUserLoginProductNotPurchased",
      vectorUserLoginProductNotPurchased
    );

    let result = vectorUserLoginProductNotPurchased.map((value, index) => {
      return (value + similarities[index]) / 2;
    });
    console.log("result", result);

    let productsNotPurchased = [];
    for (let i = 0; i < sortedAllProducts.length; i++) {
      if (i >= purchasedProductIds.size) {
        productsNotPurchased.push(sortedAllProducts[i]);
      }
    }
    console.log("productsNotPurchased", productsNotPurchased);

    // Kết hợp sản phẩm và chỉ số vào một mảng
    let combined = productsNotPurchased.map((product, index) => ({
      product,
      result: result[index],
    }));

    // Sắp xếp mảng kết hợp theo chỉ số giảm dần
    combined.sort((a, b) => b.result - a.result);

    // Lấy 3 sản phẩm có chỉ số similarity cao nhất
    let topProducts = combined.slice(0, 5).map((item) => item.product);

    console.log("Top Products by Similarity:", topProducts);

    res.status(200).json({
      success: true,
      topProducts,
    });
  } catch (error) {
    console.log("Error in myOrder controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
