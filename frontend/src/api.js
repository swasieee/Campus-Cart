import {
  cacheListing,
  compressImageToDataUrl,
  localCreateListing,
  localGetListings,
  localGetMessages,
  localLogin,
  localRegister,
  localSendMessage,
  localUpdateOffer,
  mergeServerListings,
  mergeServerMessages,
} from "./lib/localStore.js";

const CORE = (import.meta.env.VITE_CORE_API_URL || "").replace(/\/$/, "");
const ENGINE = (import.meta.env.VITE_ENGINE_API_URL || "").replace(/\/$/, "");

export const getToken = () => localStorage.getItem("token");
export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

async function request(base, path, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;

  const res = await fetch(base + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg;
    try {
      const data = await res.json();
      const d = data.detail ?? data.message ?? data.error;
      msg = typeof d === "string" ? d : d ? JSON.stringify(d) : undefined;
    } catch {
      /* non-JSON error body */
    }
    const err = new Error(msg || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

function isNetworkOrUnavailable(err) {
  return !err.status || err.status >= 500 || err.status === 404;
}

// ---- Auth ----
export async function register(payload) {
  try {
    return await request(CORE, "/api/auth/register", { method: "POST", body: payload });
  } catch (err) {
    if (isNetworkOrUnavailable(err)) return localRegister(payload);
    throw err;
  }
}

export async function login(payload) {
  try {
    return await request(CORE, "/api/auth/login", { method: "POST", body: payload });
  } catch (err) {
    if (isNetworkOrUnavailable(err)) return localLogin(payload);
    throw err;
  }
}

// ---- Listings ----
export async function getListings({ department, semester, category } = {}) {
  const params = new URLSearchParams();
  if (department) params.set("department", department);
  if (semester) params.set("semester", semester);
  if (category) params.set("category", category);
  const qs = params.toString();

  try {
    const serverItems = await request(CORE, `/api/listings${qs ? `?${qs}` : ""}`);
    const merged = mergeServerListings(serverItems);
    return merged.filter((item) => {
      if (department && item.department !== department) return false;
      if (semester && String(item.semester) !== String(semester)) return false;
      if (category && item.category !== category) return false;
      return true;
    });
  } catch {
    return localGetListings({ department, semester, category });
  }
}

export async function createListing(payload) {
  try {
    const created = await request(CORE, "/api/listings", { method: "POST", body: payload, auth: true });
    cacheListing(created);
    return created;
  } catch (err) {
    if (isNetworkOrUnavailable(err)) {
      return localCreateListing(payload, getStoredUser());
    }
    throw err;
  }
}

// ---- Media upload ----
export async function uploadImages(files) {
  return Promise.all(
    [...files].map(async (file) => {
      const dataUrl = await compressImageToDataUrl(file);
      try {
        const res = await request(ENGINE, "/api/media/upload", {
          method: "POST",
          body: { filename: file.name, contentType: "image/jpeg", dataUrl },
        });
        return res.secure_url || dataUrl;
      } catch {
        return dataUrl;
      }
    }),
  );
}

// ---- Search ranking ----
export const rankTitles = (query, items) =>
  request(ENGINE, "/api/search/rank", {
    method: "POST",
    body: { query, items: items.map((l) => ({ id: l.id, title: l.title })), min_score: 0.25 },
  });

// ---- Chat & Negotiation ----
export async function getMessages(listingId) {
  try {
    const serverMsgs = await request(CORE, `/api/messages?listingId=${encodeURIComponent(listingId)}`);
    return mergeServerMessages(listingId, serverMsgs);
  } catch {
    return localGetMessages(listingId);
  }
}

export async function sendMessage(payload) {
  try {
    const created = await request(CORE, "/api/messages", { method: "POST", body: payload, auth: true });
    mergeServerMessages(payload.listingId, [created]);
    return created;
  } catch (err) {
    if (isNetworkOrUnavailable(err)) {
      return localSendMessage(payload, getStoredUser());
    }
    throw err;
  }
}

export async function updateOfferStatus(payload) {
  try {
    const updated = await request(CORE, "/api/messages", { method: "PATCH", body: payload, auth: true });
    mergeServerMessages(updated.listingId, [updated]);
    return updated;
  } catch (err) {
    if (isNetworkOrUnavailable(err)) {
      return localUpdateOffer(payload);
    }
    throw err;
  }
}
