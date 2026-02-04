require("dotenv").config();

const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
app.use(express.json());

const AUTH_TOKEN = "Korazbay2006";
function tokenAuth(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ error: "Authorization token missing" });
  }

  const token = authHeader.split(" ")[1]; // Bearer TOKEN

  if (token !== AUTH_TOKEN) {
    return res.status(403).json({ error: "Invalid token" });
  }

  next();
}



const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URI;
const DB_NAME = "shop";

let db;

/* ===== MongoDB Connection ===== */
MongoClient.connect(MONGO_URL)
  .then((client) => {
    db = client.db(DB_NAME);
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.error(err));

/* ===== ROOT ===== */
app.get("/", (req, res) => {
  res.send(`
    <h1>Backend API</h1>
    <p>API is running</p>
    <ul>
      <li>/api/products</li>
      <li>/version</li>
    </ul>
  `);
});

/* ===== VERSION (Practice 12) ===== */
app.get("/version", (req, res) => {
  res.json({
    version: "1.1",
    updatedAt: "2026-01-29"
  });
});

/* ===== GET ALL PRODUCTS ===== */
app.get("/api/products", async (req, res) => {
  try {
    const { category, minPrice, sort, fields } = req.query;

    let filter = {};
    if (category) filter.category = category;
    if (minPrice) filter.price = { $gte: Number(minPrice) };

    let projection = {};
    if (fields) {
      fields.split(",").forEach((f) => (projection[f] = 1));
    }

    let sortOption = {};
    if (sort === "price") sortOption.price = 1;

    const products = await db
      .collection("products")
      .find(filter)
      .project(projection)
      .sort(sortOption)
      .toArray();

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/* ===== GET PRODUCT BY ID ===== */
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await db
      .collection("products")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(product);
  } catch {
    res.status(400).json({ error: "Invalid ID" });
  }
});

/* ===== CREATE PRODUCT ===== */
app.post("/api/products", tokenAuth, async (req, res) => {
  try {
    const { title, price, category } = req.body;

    if (!title || !price) {
      return res.status(400).json({ error: "title and price are required" });
    }

    const result = await db.collection("products").insertOne({
      title,
      price,
      category
    });

    res.status(201).json(result);
  } catch {
    res.status(500).json({ error: "Cannot create product" });
  }
});

/* ===== FULL UPDATE (PUT) ===== */
app.put("/api/products/:id", tokenAuth, async (req, res) => {
  try {
    const { title, price } = req.body;

    if (!title || !price) {
      return res.status(400).json({ error: "title and price are required" });
    }

    const result = await db.collection("products").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json({ message: "Product fully updated" });
  } catch {
    res.status(400).json({ error: "Invalid ID" });
  }
});

/* ===== PARTIAL UPDATE (PATCH) ===== */
app.patch("/api/products/:id", tokenAuth, async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const result = await db.collection("products").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json({ message: "Product partially updated" });
  } catch {
    res.status(400).json({ error: "Invalid ID" });
  }
});

/* ===== DELETE PRODUCT ===== */
app.delete("/api/products/:id",tokenAuth, async (req, res) => {
  try {
    const result = await db
      .collection("products")
      .deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(204).send();
  } catch {
    res.status(400).json({ error: "Invalid ID" });
  }
});

/* ===== START SERVER ===== */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
