/**
 * GraphQL Server — same dummyjson.com data, single endpoint
 * Port: 3002
 */

const express = require("express");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");

const BASE = "https://dummyjson.com";

// ── Schema ───────────────────────────────────────────────────────────────────
const typeDefs = `#graphql
  type Hair {
    color: String
    type: String
  }

  type Address {
    address: String
    city: String
    state: String
    country: String
    postalCode: String
  }

  type Bank {
    cardExpire: String
    cardNumber: String
    cardType: String
    currency: String
    iban: String
  }

  type Company {
    department: String
    name: String
    title: String
  }

  type Crypto {
    coin: String
    wallet: String
    network: String
  }

  type User {
    id: Int
    firstName: String
    lastName: String
    maidenName: String
    age: Int
    gender: String
    email: String
    phone: String
    username: String
    birthDate: String
    image: String
    bloodGroup: String
    height: Float
    weight: Float
    eyeColor: String
    hair: Hair
    ip: String
    address: Address
    macAddress: String
    university: String
    bank: Bank
    company: Company
    ein: String
    ssn: String
    userAgent: String
    role: String
    posts: [Post]
    todos: [Todo]
  }

  type PostReactions {
    likes: Int
    dislikes: Int
  }

  type Post {
    id: Int
    title: String
    body: String
    tags: [String]
    reactions: PostReactions
    views: Int
    userId: Int
  }

  type Todo {
    id: Int
    todo: String
    completed: Boolean
    userId: Int
  }

  type Dimensions {
    width: Float
    height: Float
    depth: Float
  }

  type Review {
    rating: Int
    comment: String
    date: String
    reviewerName: String
    reviewerEmail: String
  }

  type Meta {
    createdAt: String
    updatedAt: String
    barcode: String
    qrCode: String
  }

  type Product {
    id: Int
    title: String
    description: String
    category: String
    price: Float
    discountPercentage: Float
    rating: Float
    stock: Int
    tags: [String]
    brand: String
    sku: String
    weight: Float
    dimensions: Dimensions
    warrantyInformation: String
    shippingInformation: String
    availabilityStatus: String
    reviews: [Review]
    returnPolicy: String
    minimumOrderQuantity: Int
    thumbnail: String
  }

  type UsersList {
    users: [User]
    total: Int
    skip: Int
    limit: Int
  }

  type ProductsList {
    products: [Product]
    total: Int
    skip: Int
    limit: Int
  }

  type PostsList {
    posts: [Post]
    total: Int
    skip: Int
    limit: Int
  }

  type Query {
    users(limit: Int, skip: Int): UsersList
    user(id: Int!): User

    products(limit: Int, skip: Int): ProductsList
    product(id: Int!): Product

    posts(limit: Int, skip: Int): PostsList
    post(id: Int!): Post
  }
`;

// ── Resolvers ────────────────────────────────────────────────────────────────
const resolvers = {
  Query: {
    users: async (_, { limit = 10, skip = 0 }) => {
      const { data } = await axios.get(
        `${BASE}/users?limit=${limit}&skip=${skip}`
      );
      return data;
    },
    user: async (_, { id }) => {
      const { data } = await axios.get(`${BASE}/users/${id}`);
      return data;
    },
    products: async (_, { limit = 10, skip = 0 }) => {
      const { data } = await axios.get(
        `${BASE}/products?limit=${limit}&skip=${skip}`
      );
      return data;
    },
    product: async (_, { id }) => {
      const { data } = await axios.get(`${BASE}/products/${id}`);
      return data;
    },
    posts: async (_, { limit = 10, skip = 0 }) => {
      const { data } = await axios.get(
        `${BASE}/posts?limit=${limit}&skip=${skip}`
      );
      return data;
    },
    post: async (_, { id }) => {
      const { data } = await axios.get(`${BASE}/posts/${id}`);
      return data;
    },
  },

  User: {
    posts: async (parent) => {
      const { data } = await axios.get(`${BASE}/posts/user/${parent.id}`);
      return data.posts;
    },
    todos: async (parent) => {
      const { data } = await axios.get(`${BASE}/todos/user/${parent.id}`);
      return data.todos;
    },
  },
};

// ── Server setup ─────────────────────────────────────────────────────────────
async function startServer() {
  const app = express();

  app.use(cors());

  // Performance tracking middleware
  app.use((req, res, next) => {
    req._startTime = Date.now();
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      const elapsed = Date.now() - req._startTime;
      const payload = JSON.stringify(body);
      res.setHeader("X-Response-Time-Ms", elapsed);
      res.setHeader("X-Payload-Bytes", Buffer.byteLength(payload, "utf8"));
      return originalJson(body);
    };
    next();
  });

  app.get("/health", (_req, res) =>
    res.json({ status: "ok", server: "GraphQL", port: 3002 })
  );

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
  });

  await server.start();

  app.use(
    "/graphql",
    cors(),
    bodyParser.json(),
    expressMiddleware(server)
  );

  const PORT = 3002;
  app.listen(PORT, () => {
    console.log(`✅ GraphQL server running at http://localhost:${PORT}/graphql`);
  });
}

startServer().catch(console.error);
