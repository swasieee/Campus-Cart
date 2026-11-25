import { Handshake, MessageCircle, Package } from "lucide-react";
import { formatPriceRange } from "../lib/constants.js";
import { buildWhatsAppUrl } from "../lib/whatsapp.js";

export default function ListingCard({ listing, index = 0, onOpenChat }) {
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
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
      className={`animate-fade-up group flex flex-col overflow-hidden rounded-2xl border border-rule bg-white transition duration-200 hover:-translate-y-0.5 hover:border-slate2/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 ${
        sold ? "opacity-60" : ""
      }`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100 dark:bg-zinc-800/70">
        {imageUrls?.[0] ? (
          <img
            src={imageUrls[0]}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate2/70 dark:text-zinc-500">
            <Package size={24} strokeWidth={1.5} />
            <span className="text-xs">No photo</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-medium text-ink backdrop-blur dark:bg-zinc-950/80 dark:text-zinc-200">
          {category}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-base font-semibold leading-snug text-ink dark:text-zinc-100">
            {title}
          </h3>
          <span
            className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${
              listingType === "EXCHANGE"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "bg-neutral-100 text-ink dark:bg-zinc-800 dark:text-zinc-100"
            }`}
          >
            {priceLabel}
          </span>
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-slate2 dark:text-zinc-400">
          {description}
        </p>

        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px] font-medium text-slate2 dark:text-zinc-400">
          <span className="rounded border border-rule bg-chalk px-2 py-0.5 dark:border-zinc-800 dark:bg-zinc-950">
            B.Tech {department}
          </span>
          <span className="rounded border border-rule bg-chalk px-2 py-0.5 dark:border-zinc-800 dark:bg-zinc-950">
            Sem {semester}
          </span>
          {sellerName && <span className="ml-auto truncate">by {sellerName}</span>}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
          {sold ? (
            <span className="col-span-2 block rounded-lg border border-rule bg-chalk py-2 text-center text-xs font-medium text-slate2 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              No longer available
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenChat?.(listing)}
                className="btn px-3 text-xs"
              >
                <Handshake size={14} /> Negotiate
              </button>
              <a
                className="btn-ghost px-3 text-xs"
                href={buildWhatsAppUrl({ sellerPhone, sellerName, itemTitle: title })}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
