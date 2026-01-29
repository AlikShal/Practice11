
require("dotenv").config();

const express = require("express");
const { MongoClient } = require("mongodb");
const { ObjectId } = require("mongodb");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URI;

const DB_NAME = "shop";

let db;

MongoClient.connect(MONGO_URL)
  .then((client) => {
    db = client.db(DB_NAME);
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.error(err));

// GET /api/products
app.get("/api/products", async (req, res) => {
  try {
    const { category, minPrice, sort, fields } = req.query;

    let filter = {};

    if (category) {
      filter.category = category;
    }

    if (minPrice) {
      filter.price = { $gte: Number(minPrice) };
    }

    let projection = {};

    if (fields) {
      fields.split(",").forEach((field) => {
        projection[field] = 1;
      });
    }

    let sortOption = {};

    if (sort === "price") {
      sortOption.price = 1; // по возрастанию
    }

    const products = await db
      .collection("products")
      .find(filter)
      .project(projection)
      .sort(sortOption)
      .toArray();

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/", (req, res) => {
  res.send(`
    <h1>Practice Task 10</h1>
    <p>API is running</p>
    <ul>
      <li><a href="/api/products">/api/products</a></li>
      <li><a href="/api/products?category=Electronics">Filter by category</a></li>
      <li><a href="/api/products?minPrice=50">Min price</a></li>
    </ul>
  `);
});
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await db
      .collection("products")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const result = await db
      .collection("products")
      .insertOne(req.body);

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: "Cannot create product" });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const result = await db
      .collection("products")
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: req.body }
      );

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: "Update failed" });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const result = await db
      .collection("products")
      .deleteOne({ _id: new ObjectId(req.params.id) });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: "Delete failed" });
  }
});



// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
