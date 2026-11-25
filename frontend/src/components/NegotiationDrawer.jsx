import { useEffect, useState } from "react";
import { Check, MessageCircle, Send, Tag, X, XCircle } from "lucide-react";
import { getMessages, sendMessage, updateOfferStatus } from "../api.js";
import { formatPriceRange } from "../lib/constants.js";
import { buildWhatsAppUrl } from "../lib/whatsapp.js";

export default function NegotiationDrawer({ listing, user, onClose, onRequireAuth }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const minPrice = Number(listing.priceMin ?? listing.price ?? 0);
  const isSeller = Boolean(user && listing.sellerEmail && user.email === listing.sellerEmail);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMessages(listing.id)
      .then((data) => {
        if (active) setMessages(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [listing.id]);

  async function handleSend(e, overrideOffer = null) {
    if (e) e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }
    const finalOffer = overrideOffer !== null ? overrideOffer : offerAmount;
    if (!text.trim() && finalOffer === "") return;

    setError("");
    setBusy(true);
    try {
      const created = await sendMessage({
        listingId: listing.id,
        text: text.trim() || (finalOffer !== "" ? `Proposed an offer of ₹${finalOffer}` : ""),
        offerAmount: finalOffer !== "" ? Number(finalOffer) : null,
      });
      setMessages((prev) => [...prev, created]);
      setText("");
      setOfferAmount("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleOfferDecision(messageId, status) {
    try {
      const updated = await updateOfferStatus({ messageId, offerStatus: status });
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, offerStatus: updated.offerStatus } : m)));
    } catch (err) {
      setError(err.message);
    }
  }

  const quickOffers =
    minPrice > 0
      ? [
          { label: `Match ₹${minPrice}`, val: minPrice },
          { label: `-10% (₹${Math.max(1, Math.round(minPrice * 0.9))})`, val: Math.max(1, Math.round(minPrice * 0.9)) },
          { label: `-20% (₹${Math.max(1, Math.round(minPrice * 0.8))})`, val: Math.max(1, Math.round(minPrice * 0.8)) },
        ]
      : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs" onClick={onClose}>
      <aside
        className="animate-slide-in flex h-full w-full max-w-md flex-col border-l border-rule bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-rule px-5 py-4 dark:border-zinc-800">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate2 dark:text-zinc-400">
              Chat & Price Negotiation
            </p>
            <h2 className="truncate font-display text-base font-bold text-ink dark:text-zinc-100">
              {listing.title}
            </h2>
            <p className="mt-0.5 text-xs text-slate2 dark:text-zinc-400">
              {formatPriceRange(listing)} · Seller: {listing.sellerName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close negotiation drawer"
            className="btn-ghost px-2 py-1.5"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-rule bg-chalk px-5 py-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-900/60">
          <span className="text-slate2 dark:text-zinc-400">
            B.Tech {listing.department} · Sem {listing.semester}
          </span>
          {listing.sellerPhone && (
            <a
              href={buildWhatsAppUrl({
                sellerPhone: listing.sellerPhone,
                sellerName: listing.sellerName,
                itemTitle: listing.title,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline dark:text-emerald-400"
            >
              <MessageCircle size={13} /> WhatsApp
            </a>
          )}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {loading && <p className="text-xs text-slate2 dark:text-zinc-400">Loading messages…</p>}
          {!loading && messages.length === 0 && (
            <div className="rounded-xl border border-dashed border-rule p-6 text-center dark:border-zinc-800">
              <p className="text-sm font-medium text-ink dark:text-zinc-200">Start a negotiation</p>
              <p className="mt-1 text-xs text-slate2 dark:text-zinc-400">
                Ask about condition, pickup spot, or propose a fair price.
              </p>
            </div>
          )}

          {messages.map((m) => {
            const mine = Boolean(user && m.senderEmail === user.email);
            return (
              <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <span className="mb-1 text-[11px] text-slate2 dark:text-zinc-500">
                  {mine ? "You" : m.senderName}
                </span>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    mine
                      ? "bg-ink text-white dark:bg-zinc-100 dark:text-zinc-950"
                      : "border border-rule bg-chalk text-ink dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {m.offerAmount !== null && m.offerAmount !== undefined && (
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold">
                      <Tag size={12} />
                      <span>Offer: ₹{m.offerAmount}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          m.offerStatus === "ACCEPTED"
                            ? "bg-emerald-500/20 text-emerald-500"
                            : m.offerStatus === "DECLINED"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-amber-500/20 text-amber-500"
                        }`}
                      >
                        {m.offerStatus || "PENDING"}
                      </span>
                    </div>
                  )}
                  <p className="leading-relaxed">{m.text}</p>

                  {isSeller && m.offerAmount !== null && m.offerStatus === "PENDING" && (
                    <div className="mt-2 flex gap-2 border-t border-white/15 pt-2 dark:border-zinc-700">
                      <button
                        type="button"
                        onClick={() => handleOfferDecision(m.id, "ACCEPTED")}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                      >
                        <Check size={12} /> Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOfferDecision(m.id, "DECLINED")}
                        className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-500"
                      >
                        <XCircle size={12} /> Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSend} className="space-y-2.5 border-t border-rule p-4 dark:border-zinc-800">
          {quickOffers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {quickOffers.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  disabled={busy}
                  onClick={() => handleSend(null, q.val)}
                  className="rounded-full border border-rule bg-chalk px-2.5 py-1 text-[11px] font-medium text-ink transition hover:border-ink/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600"
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              placeholder="Offer ₹"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              className="field w-28 shrink-0"
              aria-label="Offer amount in rupees"
            />
            <input
              type="text"
              placeholder={user ? "Message or counter-offer…" : "Log in to chat & negotiate…"}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="field flex-1"
            />
            <button type="submit" disabled={busy} className="btn px-3.5" aria-label="Send message">
              <Send size={15} />
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
