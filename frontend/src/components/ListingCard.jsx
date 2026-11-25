import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl } from "../lib/whatsapp.js";

export default function ListingCard({ listing }) {
  const { title, description, price, listingType, category, semester, department, imageUrls, sellerName, sellerPhone, status } = listing;
  const sold = status && status !== "AVAILABLE";

  return (
    <article className={`flex flex-col overflow-hidden rounded-lg border border-rule bg-white ${sold ? "opacity-60" : ""}`}>
      {imageUrls?.[0] ? (
        <img src={imageUrls[0]} alt={title} className="h-44 w-full object-cover" loading="lazy" />
      ) : (
        <div className="grid h-44 place-items-center bg-chalk text-sm text-slate2">No photo</div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-bold leading-snug">{title}</h3>
          <span className="shrink-0 rounded bg-mark px-2 py-0.5 text-sm font-bold">
            {listingType === "EXCHANGE" ? "Swap" : `₹${price}`}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-slate2">{description}</p>
        <p className="text-xs text-slate2">{category} · {department} · Sem {semester}</p>
        <div className="mt-auto pt-2">
          {sold ? (
            <span className="text-sm font-medium text-slate2">No longer available</span>
          ) : (
            <a
              className="btn w-full"
              href={buildWhatsAppUrl({ sellerPhone, sellerName, itemTitle: title })}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={16} /> Message {sellerName?.split(" ")[0] ?? "seller"}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
