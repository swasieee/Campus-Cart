/**
 * Client-side persistence + image compression + resilient fallback store so
 * listings, images, auth, and negotiation chats work reliably even offline
 * or across serverless cold starts.
 */
const KEYS = {
  users: "cc_users_v1",
  listings: "cc_listings_v1",
  messages: "cc_messages_v1",
};

const SEED_USERS = [
  {
    id: 1,
    name: "Aarav Sharma",
    email: "aarav@gmail.com",
    password: "campus1234",
    department: "CSE",
    semester: 5,
    phone: "919876543210",
  },
];

const SEED_LISTINGS = [
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
  },
];

const SEED_MESSAGES = [
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
];

function readList(key, seed) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupted cache
  }
  localStorage.setItem(key, JSON.stringify(seed));
  return [...seed];
}

function writeList(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export function compressImageToDataUrl(file, maxDim = 960, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read selected image."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Selected file is not a valid image."));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function mergeServerListings(serverItems) {
  const local = readList(KEYS.listings, SEED_LISTINGS);
  const byId = new Map(local.map((i) => [i.id, i]));
  for (const item of serverItems) byId.set(item.id, item);
  const merged = [...byId.values()].sort((a, b) => Number(b.id) - Number(a.id));
  writeList(KEYS.listings, merged);
  return merged;
}

export function cacheListing(item) {
  const local = readList(KEYS.listings, SEED_LISTINGS);
  const next = [item, ...local.filter((i) => i.id !== item.id)];
  writeList(KEYS.listings, next);
}

export function localGetListings({ department, semester, category } = {}) {
  const items = readList(KEYS.listings, SEED_LISTINGS);
  return items.filter((item) => {
    if (department && item.department !== department) return false;
    if (semester && String(item.semester) !== String(semester)) return false;
    if (category && item.category !== category) return false;
    return true;
  });
}

export function localCreateListing(payload, user) {
  const items = readList(KEYS.listings, SEED_LISTINGS);
  const created = {
    id: Date.now(),
    ...payload,
    sellerName: user?.name || "Student",
    sellerEmail: user?.email || "",
    sellerPhone: user?.phone || "",
    status: "AVAILABLE",
    createdAt: new Date().toISOString(),
  };
  writeList(KEYS.listings, [created, ...items]);
  return created;
}

export function localRegister(payload) {
  const users = readList(KEYS.users, SEED_USERS);
  const email = String(payload.email || "").trim().toLowerCase();
  if (users.some((u) => u.email === email)) {
    throw new Error("An account with this email already exists. Please log in.");
  }
  const user = {
    id: Date.now(),
    name: payload.name || email.split("@")[0],
    email,
    password: payload.password,
    department: payload.department || "CSE",
    semester: Number(payload.semester) || 3,
    phone: String(payload.phone || "").replace(/\D/g, ""),
  };
  writeList(KEYS.users, [...users, user]);
  const { password: _, ...safeUser } = user;
  return { token: `local-${user.id}`, user: safeUser };
}

export function localLogin(payload) {
  const users = readList(KEYS.users, SEED_USERS);
  const email = String(payload.email || "").trim().toLowerCase();
  const found = users.find((u) => u.email === email && u.password === payload.password);
  if (!found) throw new Error("Invalid email or password.");
  const { password: _, ...safeUser } = found;
  return { token: `local-${found.id}`, user: safeUser };
}

export function mergeServerMessages(listingId, serverMsgs) {
  const all = readList(KEYS.messages, SEED_MESSAGES);
  const byId = new Map(all.map((m) => [m.id, m]));
  for (const m of serverMsgs) byId.set(m.id, m);
  const merged = [...byId.values()].sort((a, b) => Number(a.id) - Number(b.id));
  writeList(KEYS.messages, merged);
  return merged.filter((m) => Number(m.listingId) === Number(listingId));
}

export function localGetMessages(listingId) {
  const all = readList(KEYS.messages, SEED_MESSAGES);
  return all.filter((m) => Number(m.listingId) === Number(listingId));
}

export function localSendMessage({ listingId, text, offerAmount }, user) {
  const all = readList(KEYS.messages, SEED_MESSAGES);
  const msg = {
    id: Date.now(),
    listingId: Number(listingId),
    senderName: user?.name || "Student",
    senderEmail: user?.email || "",
    text: text || `Offered ₹${offerAmount}`,
    offerAmount: offerAmount !== undefined && offerAmount !== null && offerAmount !== "" ? Number(offerAmount) : null,
    offerStatus: offerAmount !== undefined && offerAmount !== null && offerAmount !== "" ? "PENDING" : null,
    createdAt: new Date().toISOString(),
  };
  writeList(KEYS.messages, [...all, msg]);
  return msg;
}

export function localUpdateOffer({ messageId, offerStatus }) {
  const all = readList(KEYS.messages, SEED_MESSAGES);
  const next = all.map((m) => (Number(m.id) === Number(messageId) ? { ...m, offerStatus } : m));
  writeList(KEYS.messages, next);
  return next.find((m) => Number(m.id) === Number(messageId));
}
