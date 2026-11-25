/**
 * Lightweight local mock for the Java core backend (port 8080) so the frontend
 * and Python search/media engine can be tested end-to-end before the Java
 * service is running. Matches the contract documented in README.md.
 */
import http from "node:http";

const PORT = Number(process.env.CORE_MOCK_PORT || 8080);
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

const users = new Map([
  [
    "aarav@gmail.com",
    {
      id: 1,
      name: "Aarav Sharma",
      email: "aarav@gmail.com",
      department: "CSE",
      semester: 5,
      phone: "919876543210",
    },
  ],
]);

const tokens = new Map([["dev-token-1", users.get("aarav@gmail.com")]]);

const listings = [
  {
    id: 101,
    title: "Morris Mano Digital Design (5th Edition)",
    description: "Clean pages, no highlights. Great for Digital Logic in Sem 3.",
    price: 300,
    priceMin: 300,
    priceMax: 380,
    listingType: "SELL",
    category: "Books",
    semester: 3,
    department: "CSE",
    imageUrls: [],
    sellerName: "Aarav Sharma",
    sellerPhone: "919876543210",
    status: "AVAILABLE",
  },
  {
    id: 102,
    title: "Data Structures & Algorithms Handwritten Notes",
    description: "Complete semester notes covering trees, graphs, DP, and past exam solutions.",
    price: 100,
    priceMin: 100,
    priceMax: 150,
    listingType: "SELL",
    category: "Notes",
    semester: 3,
    department: "IT",
    imageUrls: [],
    sellerName: "Diya Nair",
    sellerPhone: "919811223344",
    status: "AVAILABLE",
  },
  {
    id: 103,
    title: "Arduino Uno + Breadboard Lab Kit",
    description: "Includes jumper wires, sensors, and USB cable. Willing to swap for Casio fx-991EX.",
    price: 450,
    priceMin: 450,
    priceMax: 600,
    listingType: "EXCHANGE",
    category: "Lab Equipment",
    semester: 2,
    department: "ECE",
    imageUrls: [],
    sellerName: "Rohan Verma",
    sellerPhone: "919822334455",
    status: "AVAILABLE",
  },
  {
    id: 104,
    title: "Casio fx-991EX Scientific Calculator",
    description: "Original ClassWiz, barely used, working solar + battery.",
    price: 700,
    priceMin: 700,
    priceMax: 800,
    listingType: "SELL",
    category: "Electronics",
    semester: 1,
    department: "ME",
    imageUrls: [],
    sellerName: "Meera Iyer",
    sellerPhone: "919833445566",
    status: "AVAILABLE",
  },
];

let nextUserId = 2;
let nextListingId = 105;

function sendJson(res, status, payload) {
  const body = payload === null ? "" : JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) reject(new Error("Payload too large"));
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function makeUser(body) {
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || email.split("@")[0] || "Campus Student").trim();
  return {
    id: nextUserId++,
    name,
    email,
    department: body.department || "CSE",
    semester: Number(body.semester) || 3,
    phone: String(body.phone || "919876543210").replace(/\D/g, ""),
  };
}

function issueSession(user) {
  const token = `dev-token-${user.id}-${Date.now()}`;
  tokens.set(token, user);
  return { token, user };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return sendJson(res, 204, null);

  const url = new URL(req.url, `http://localhost:${PORT}`);

  try {
    if (req.method === "GET" && url.pathname === "/health") {
      return sendJson(res, 200, { status: "ok", mode: "dev-mock" });
    }

    if (req.method === "POST" && url.pathname === "/api/auth/register") {
      const body = await readJson(req);
      const email = String(body.email || "").trim().toLowerCase();
      if (!email) return sendJson(res, 400, { message: "Email is required." });
      const user = makeUser(body);
      users.set(email, user);
      return sendJson(res, 201, issueSession(user));
    }

    if (req.method === "POST" && url.pathname === "/api/auth/login") {
      const body = await readJson(req);
      const email = String(body.email || "").trim().toLowerCase();
      if (!email) return sendJson(res, 400, { message: "Email is required." });
      const user = users.get(email) ?? makeUser(body);
      users.set(email, user);
      return sendJson(res, 200, issueSession(user));
    }

    if (req.method === "GET" && url.pathname === "/api/listings") {
      const dept = url.searchParams.get("department");
      const sem = url.searchParams.get("semester");
      const cat = url.searchParams.get("category");
      const minPrice = url.searchParams.get("minPrice");
      const maxPrice = url.searchParams.get("maxPrice");
      const filtered = listings.filter((item) => {
        if (dept && item.department !== dept) return false;
        if (sem && String(item.semester) !== sem) return false;
        if (cat && item.category !== cat) return false;
        const low = Number(item.priceMin ?? item.price ?? 0);
        const high = Number(item.priceMax ?? item.price ?? low);
        if (minPrice && high < Number(minPrice)) return false;
        if (maxPrice && low > Number(maxPrice)) return false;
        return true;
      });
      return sendJson(res, 200, filtered);
    }

    if (req.method === "POST" && url.pathname === "/api/listings") {
      const auth = req.headers.authorization || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      const seller = tokens.get(token);
      if (!seller) return sendJson(res, 401, { message: "Please log in first." });

      const body = await readJson(req);
      const minPrice = Number(body.priceMin ?? body.price ?? 0);
      const maxPrice = Number(body.priceMax ?? minPrice);
      const item = {
        id: nextListingId++,
        title: String(body.title || "").trim(),
        description: String(body.description || "").trim(),
        price: minPrice,
        priceMin: minPrice,
        priceMax: maxPrice,
        listingType: body.listingType || "SELL",
        category: body.category || "Other",
        semester: Number(body.semester) || seller.semester,
        department: body.department || seller.department,
        imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls : [],
        sellerName: seller.name,
        sellerPhone: seller.phone,
        status: "AVAILABLE",
      };
      listings.unshift(item);
      return sendJson(res, 201, item);
    }

    return sendJson(res, 404, { message: "Not found" });
  } catch (err) {
    return sendJson(res, 400, { message: err.message || "Bad request" });
  }
});

server.listen(PORT, () => {
  console.log(`[mock-core] listening on http://localhost:${PORT}`);
});
