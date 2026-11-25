import { authUserFromReq, createItem, listItems, readJson, sendJson } from "./_store.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return sendJson(res, 204, null);

  try {
    if (req.method === "GET") {
      const url = new URL(req.url, "http://localhost");
      const items = await listItems({
        department: url.searchParams.get("department") || "",
        semester: url.searchParams.get("semester") || "",
        category: url.searchParams.get("category") || "",
        minPrice: url.searchParams.get("minPrice") || "",
        maxPrice: url.searchParams.get("maxPrice") || "",
      });
      return sendJson(res, 200, items);
    }

    if (req.method === "POST") {
      const user = authUserFromReq(req);
      if (!user) return sendJson(res, 401, { message: "Please log in first." });
      const body = await readJson(req);
      const created = await createItem(body, user);
      return sendJson(res, 201, created);
    }

    return sendJson(res, 405, { message: "Method not allowed" });
  } catch (err) {
    return sendJson(res, 400, { message: err.message });
  }
}
