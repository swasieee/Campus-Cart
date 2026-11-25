/**
 * Shared API store + auth + Supabase/local persistence for Vercel serverless
 * functions (/api/*) and local dev mock-core server.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const HAS_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_KEY);

const TOKEN_SECRET = process.env.AUTH_SECRET || "campus-cart-dev-secret-2026";
const STORE_PATH = process.env.VERCEL
  ? "/tmp/campus-cart-store.json"
  : path.resolve(process.cwd(), ".local-db.json");

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password), salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const derived = crypto.scryptSync(String(password), salt, 32);
  const expected = Buffer.from(hash, "hex");
  return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
}

export function signToken(user) {
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      semester: user.semester,
      phone: user.phone,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }),
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", TOKEN_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyToken(token) {
  const [payload, sig] = String(token || "").split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", TOKEN_SECRET).update(payload).digest("base64url");
  if (sig !== expected) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

export function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    department: u.department,
    semester: Number(u.semester) || 3,
    phone: u.phone || "",
  };
}

function initialStore() {
  return {
    nextId: 200,
    users: [
      {
        id: 1,
        name: "Aarav Sharma",
        email: "aarav@gmail.com",
        passwordHash: hashPassword("campus1234"),
        department: "CSE",
        semester: 5,
        phone: "919876543210",
      },
    ],
    listings: [
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
        sellerEmail: "aarav@gmail.com",
        sellerPhone: "919876543210",
        status: "AVAILABLE",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
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
        sellerEmail: "diya.nair@gmail.com",
        sellerPhone: "919811223344",
        status: "AVAILABLE",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
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
        sellerEmail: "rohan.verma@gmail.com",
        sellerPhone: "919822334455",
        status: "AVAILABLE",
        createdAt: new Date(Date.now() - 43200000).toISOString(),
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
        sellerEmail: "meera.iyer@gmail.com",
        sellerPhone: "919833445566",
        status: "AVAILABLE",
        createdAt: new Date(Date.now() - 21600000).toISOString(),
      },
    ],
    messages: [
      {
        id: 151,
        listingId: 101,
        senderName: "Riya Patel",
        senderEmail: "riya.patel@gmail.com",
        text: "Is the Morris Mano book still available? Can we do ₹320 near the CSE block?",
        offerAmount: 320,
        offerStatus: "PENDING",
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
    ],
  };
}

function loadStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
    }
  } catch {
    // Fall back to fresh store if corrupted
  }
  const fresh = initialStore();
  saveStore(fresh);
  return fresh;
}

function saveStore(store) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // Non-fatal on read-only environments
  }
}

async function sbFetch(table, { method = "GET", query = "", body, prefer = "return=representation" } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: prefer,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || data?.error || `Supabase error (${res.status})`);
  return data;
}

function mapRowToListing(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price ?? 0),
    priceMin: Number(row.price_min ?? row.price ?? 0),
    priceMax: Number(row.price_max ?? row.price ?? 0),
    listingType: row.listing_type,
    category: row.category,
    semester: Number(row.semester),
    department: row.department,
    imageUrls: Array.isArray(row.image_urls) ? row.image_urls : [],
    sellerName: row.seller_name,
    sellerEmail: row.seller_email,
    sellerPhone: row.seller_phone,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapRowToMessage(row) {
  return {
    id: row.id,
    listingId: row.listing_id,
    senderName: row.sender_name,
    senderEmail: row.sender_email,
    text: row.text,
    offerAmount: row.offer_amount !== null && row.offer_amount !== undefined ? Number(row.offer_amount) : null,
    offerStatus: row.offer_status || "PENDING",
    createdAt: row.created_at,
  };
}

export function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

export function sendJson(res, status, payload) {
  setCors(res);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(payload === null ? "" : JSON.stringify(payload));
}

export async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 8 * 1024 * 1024) reject(new Error("Payload too large"));
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

export function authUserFromReq(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return verifyToken(token);
}

export async function registerUser(body) {
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !email.includes("@")) throw new Error("Valid email is required.");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");

  const passwordHash = hashPassword(password);
  const userFields = {
    name: String(body.name || email.split("@")[0]).trim(),
    email,
    department: body.department || "CSE",
    semester: Number(body.semester) || 3,
    phone: String(body.phone || "").replace(/\D/g, ""),
  };

  if (HAS_SUPABASE) {
    const existing = await sbFetch("campus_users", {
      query: `?email=eq.${encodeURIComponent(email)}&select=*`,
    });
    if (existing.length) throw new Error("An account with this email already exists. Please log in.");
    const [created] = await sbFetch("campus_users", {
      method: "POST",
      body: { ...userFields, password_hash: passwordHash },
    });
    const user = publicUser(created);
    return { token: signToken(user), user };
  }

  const store = loadStore();
  if (store.users.some((u) => u.email === email)) {
    throw new Error("An account with this email already exists. Please log in.");
  }
  const created = { id: store.nextId++, ...userFields, passwordHash };
  store.users.push(created);
  saveStore(store);
  const user = publicUser(created);
  return { token: signToken(user), user };
}

export async function loginUser(body) {
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) throw new Error("Email and password are required.");

  if (HAS_SUPABASE) {
    const rows = await sbFetch("campus_users", {
      query: `?email=eq.${encodeURIComponent(email)}&select=*`,
    });
    const found = rows[0];
    if (!found || !verifyPassword(password, found.password_hash)) {
      throw new Error("Invalid email or password.");
    }
    const user = publicUser(found);
    return { token: signToken(user), user };
  }

  const store = loadStore();
  const found = store.users.find((u) => u.email === email);
  if (!found || !verifyPassword(password, found.passwordHash)) {
    throw new Error("Invalid email or password.");
  }
  const user = publicUser(found);
  return { token: signToken(user), user };
}

export async function listItems(filters = {}) {
  let items;
  if (HAS_SUPABASE) {
    const rows = await sbFetch("campus_listings", { query: "?select=*&order=id.desc" });
    items = rows.map(mapRowToListing);
  } else {
    items = loadStore().listings;
  }

  return items.filter((item) => {
    if (filters.department && item.department !== filters.department) return false;
    if (filters.semester && String(item.semester) !== String(filters.semester)) return false;
    if (filters.category && item.category !== filters.category) return false;
    const low = Number(item.priceMin ?? item.price ?? 0);
    const high = Number(item.priceMax ?? item.price ?? low);
    if (filters.minPrice && high < Number(filters.minPrice)) return false;
    if (filters.maxPrice && low > Number(filters.maxPrice)) return false;
    return true;
  });
}

export async function createItem(body, seller) {
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  if (!title || !description) throw new Error("Title and description are required.");

  const minPrice = Number(body.priceMin ?? body.price ?? 0);
  const maxPrice = Number(body.priceMax ?? minPrice);
  if (maxPrice < minPrice) throw new Error("Max price must be greater than or equal to min price.");

  const payload = {
    title,
    description,
    price: minPrice,
    priceMin: minPrice,
    priceMax: maxPrice,
    listingType: body.listingType || "SELL",
    category: body.category || "Books",
    semester: Number(body.semester) || seller.semester,
    department: body.department || seller.department,
    imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls : [],
    sellerName: seller.name,
    sellerEmail: seller.email,
    sellerPhone: seller.phone || "",
    status: "AVAILABLE",
    createdAt: new Date().toISOString(),
  };

  if (HAS_SUPABASE) {
    const [row] = await sbFetch("campus_listings", {
      method: "POST",
      body: {
        title: payload.title,
        description: payload.description,
        price: payload.price,
        price_min: payload.priceMin,
        price_max: payload.priceMax,
        listing_type: payload.listingType,
        category: payload.category,
        semester: payload.semester,
        department: payload.department,
        image_urls: payload.imageUrls,
        seller_name: payload.sellerName,
        seller_email: payload.sellerEmail,
        seller_phone: payload.sellerPhone,
        status: payload.status,
      },
    });
    return mapRowToListing(row);
  }

  const store = loadStore();
  const created = { id: store.nextId++, ...payload };
  store.listings.unshift(created);
  saveStore(store);
  return created;
}

export async function listMessages(listingId) {
  const idNum = Number(listingId);
  if (HAS_SUPABASE) {
    const q = idNum ? `?listing_id=eq.${idNum}&order=id.asc` : "?order=id.asc";
    const rows = await sbFetch("campus_messages", { query: q });
    return rows.map(mapRowToMessage);
  }
  const all = loadStore().messages;
  return idNum ? all.filter((m) => Number(m.listingId) === idNum) : all;
}

export async function addMessage(body, sender) {
  const listingId = Number(body.listingId);
  const text = String(body.text || "").trim();
  const offerAmount =
    body.offerAmount !== undefined && body.offerAmount !== null && body.offerAmount !== ""
      ? Number(body.offerAmount)
      : null;

  if (!listingId) throw new Error("listingId is required.");
  if (!text && offerAmount === null) throw new Error("Message text or offer amount is required.");

  const msgText = text || `Offered ₹${offerAmount}`;
  const offerStatus = offerAmount !== null ? "PENDING" : null;

  if (HAS_SUPABASE) {
    const [row] = await sbFetch("campus_messages", {
      method: "POST",
      body: {
        listing_id: listingId,
        sender_name: sender.name,
        sender_email: sender.email,
        text: msgText,
        offer_amount: offerAmount,
        offer_status: offerStatus,
      },
    });
    return mapRowToMessage(row);
  }

  const store = loadStore();
  const created = {
    id: store.nextId++,
    listingId,
    senderName: sender.name,
    senderEmail: sender.email,
    text: msgText,
    offerAmount,
    offerStatus,
    createdAt: new Date().toISOString(),
  };
  store.messages.push(created);
  saveStore(store);
  return created;
}

export async function updateOfferStatus(body, user) {
  const messageId = Number(body.messageId);
  const status = String(body.offerStatus || "").toUpperCase();
  if (!messageId || !["ACCEPTED", "DECLINED", "PENDING"].includes(status)) {
    throw new Error("Invalid offer update.");
  }

  if (HAS_SUPABASE) {
    const [row] = await sbFetch("campus_messages", {
      method: "PATCH",
      query: `?id=eq.${messageId}`,
      body: { offer_status: status },
    });
    return mapRowToMessage(row);
  }

  const store = loadStore();
  const msg = store.messages.find((m) => Number(m.id) === messageId);
  if (!msg) throw new Error("Offer not found.");
  const listing = store.listings.find((l) => Number(l.id) === Number(msg.listingId));
  if (listing && listing.sellerEmail && listing.sellerEmail !== user.email) {
    throw new Error("Only the seller can accept or decline offers.");
  }
  msg.offerStatus = status;
  saveStore(store);
  return msg;
}

export async function uploadToStorage({ dataUrl, filename = "upload.jpg", contentType = "image/jpeg" }) {
  if (!String(dataUrl || "").startsWith("data:image/")) {
    throw new Error("Invalid image data.");
  }
  if (HAS_SUPABASE) {
    const base64 = dataUrl.split(",")[1];
    const buffer = Buffer.from(base64, "base64");
    const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/listing-images/${safeName}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": contentType,
      },
      body: buffer,
    });
    if (res.ok) {
      return {
        secure_url: `${SUPABASE_URL}/storage/v1/object/public/listing-images/${safeName}`,
        public_id: safeName,
      };
    }
  }
  return { secure_url: dataUrl, public_id: `inline-${Date.now()}` };
}

export function rankListings(query, items = []) {
  const q = String(query || "").toLowerCase().trim();
  if (!q) return { ranked: [], ids: [], engine: "js-serverless" };

  const scoreTitle = (title) => {
    const t = String(title || "").toLowerCase();
    if (!t) return 0;
    let prev = Array.from({ length: t.length + 1 }, (_, i) => i);
    for (let i = 1; i <= q.length; i++) {
      const curr = [i];
      for (let j = 1; j <= t.length; j++) {
        curr.push(
          Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (q[i - 1] !== t[j - 1] ? 1 : 0)),
        );
      }
      prev = curr;
    }
    let score = 1 - prev[t.length] / Math.max(q.length, t.length);
    if (t.includes(q)) score = Math.max(score, 0.85 + (0.15 * q.length) / t.length);
    return Number(score.toFixed(4));
  };

  const ranked = items
    .map((item) => ({ id: item.id, score: scoreTitle(item.title) }))
    .filter((s) => s.score >= 0.25)
    .sort((a, b) => b.score - a.score);

  return { ranked, ids: ranked.map((r) => r.id), engine: "js-serverless" };
}

export function isSupabaseEnabled() {
  return HAS_SUPABASE;
}
