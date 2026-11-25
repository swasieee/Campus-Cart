import { addMessage, authUserFromReq, listMessages, readJson, sendJson, updateOfferStatus } from "./_store.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return sendJson(res, 204, null);

  try {
    if (req.method === "GET") {
      const url = new URL(req.url, "http://localhost");
      const listingId = url.searchParams.get("listingId");
      return sendJson(res, 200, await listMessages(listingId));
    }

    if (req.method === "POST") {
      const user = authUserFromReq(req);
      if (!user) return sendJson(res, 401, { message: "Please log in to send a message or offer." });
      const body = await readJson(req);
      return sendJson(res, 201, await addMessage(body, user));
    }

    if (req.method === "PATCH") {
      const user = authUserFromReq(req);
      if (!user) return sendJson(res, 401, { message: "Please log in first." });
      const body = await readJson(req);
      return sendJson(res, 200, await updateOfferStatus(body, user));
    }

    return sendJson(res, 405, { message: "Method not allowed" });
  } catch (err) {
    return sendJson(res, 400, { message: err.message });
  }
}
