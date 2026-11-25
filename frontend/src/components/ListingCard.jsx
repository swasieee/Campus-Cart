import { MessageCircle, Package } from "lucide-react";
import { formatPriceRange } from "../lib/constants.js";
import { buildWhatsAppUrl } from "../lib/whatsapp.js";

export default function ListingCard({ listing }) {
  const {
    title,
    description,
    price,
    priceMin,
    priceMax,
    listingType,
    category,
    semester,
    department,
    imageUrls,
    sellerName,
    sellerPhone,
    status,
  } = listing;

  const sold = status && status !== "AVAILABLE";
  const priceLabel = formatPriceRange({ price, priceMin, priceMax, listingType });

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-xl border border-rule bg-white transition hover:border-slate2/40 hover:shadow-sm ${
        sold ? "opacity-60" : ""
      }`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
        {imageUrls?.[0] ? (
          <img
            src={imageUrls[0]}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate2/70">
            <Package size={24} strokeWidth={1.5} />
            <span className="text-xs">No photo</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-medium text-ink backdrop-blur">
          {category}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-base font-semibold leading-snug text-ink">{title}</h3>
          <span
            className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${
              listingType === "EXCHANGE"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-neutral-100 text-ink"
            }`}
          >
            {priceLabel}
          </span>
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-slate2">{description}</p>

        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px] font-medium text-slate2">
          <span className="rounded bg-chalk px-2 py-0.5 border border-rule">B.Tech {department}</span>
          <span className="rounded bg-chalk px-2 py-0.5 border border-rule">Sem {semester}</span>
          {sellerName && <span className="ml-auto truncate text-slate2">by {sellerName}</span>}
        </div>

        <div className="mt-auto pt-2">
          {sold ? (
            <span className="block rounded-lg border border-rule bg-chalk py-2 text-center text-xs font-medium text-slate2">
              No longer available
            </span>
          ) : (
            <a
              className="btn w-full"
              href={buildWhatsAppUrl({ sellerPhone, sellerName, itemTitle: title })}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={15} /> Message {sellerName?.split(" ")[0] ?? "seller"}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
