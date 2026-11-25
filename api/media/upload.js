import { readJson, sendJson, uploadToStorage } from "../_store.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return sendJson(res, 204, null);
  if (req.method !== "POST") return sendJson(res, 405, { message: "Method not allowed" });

  try {
    const body = await readJson(req);
    const result = await uploadToStorage(body);
    return sendJson(res, 200, result);
  } catch (err) {
    return sendJson(res, 400, { message: err.message });
  }
}
