const CORE = import.meta.env.VITE_CORE_API_URL ?? "http://localhost:8080";
const ENGINE = import.meta.env.VITE_ENGINE_API_URL ?? "http://localhost:8000";

export const getToken = () => localStorage.getItem("token");

async function request(base, path, { method = "GET", body, form, auth = false } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;

  const res = await fetch(base + path, {
    method,
    headers,
    body: form ?? (body ? JSON.stringify(body) : undefined),
  });

  if (!res.ok) {
    let msg;
    try {
      const data = await res.json();
      const d = data.detail ?? data.message ?? data.error;
      msg = typeof d === "string" ? d : d ? JSON.stringify(d) : undefined;
    } catch { /* non-JSON error body */ }
    throw new Error(msg || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

// ---- Java core (Spring Boot) ----
// Assumed contract: both auth endpoints return { token, user }.
export const register = (payload) => request(CORE, "/api/auth/register", { method: "POST", body: payload });
export const login = (payload) => request(CORE, "/api/auth/login", { method: "POST", body: payload });

export function getListings({ department, semester, category } = {}) {
  const params = new URLSearchParams();
  if (department) params.set("department", department);
  if (semester) params.set("semester", semester);
  if (category) params.set("category", category);
  const qs = params.toString();
  return request(CORE, `/api/listings${qs ? `?${qs}` : ""}`);
}

export const createListing = (payload) =>
  request(CORE, "/api/listings", { method: "POST", body: payload, auth: true });

// ---- Python engine (FastAPI) ----
export async function uploadImages(files) {
  const urls = await Promise.all(
    [...files].map((file) => {
      const form = new FormData();
      form.append("file", file);
      return request(ENGINE, "/api/media/upload", { method: "POST", form });
    })
  );
  return urls.map((u) => u.secure_url);
}

export const rankTitles = (query, items) =>
  request(ENGINE, "/api/search/rank", {
    method: "POST",
    body: { query, items: items.map((l) => ({ id: l.id, title: l.title })), min_score: 0.25 },
  });
