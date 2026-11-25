import { useEffect, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { getListings, rankTitles } from "../api.js";
import { CATEGORIES, DEPARTMENTS, SEMESTERS } from "../lib/constants.js";
import ListingCard from "./ListingCard.jsx";

const EMPTY_FILTERS = {
  department: "",
  semester: "",
  category: "",
  minPrice: "",
  maxPrice: "",
};

function matchesPriceRange(item, minPrice, maxPrice) {
  const itemLow = Number(item.priceMin ?? item.price ?? 0);
  const itemHigh = Number(item.priceMax ?? item.price ?? itemLow);
  if (minPrice !== "" && itemHigh < Number(minPrice)) return false;
  if (maxPrice !== "" && itemLow > Number(maxPrice)) return false;
  return true;
}

export default function Marketplace({ onOpenChat }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [query, setQuery] = useState("");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const setFilter = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  const hasActiveFilters = query.trim() !== "" || Object.values(filters).some(Boolean);

  function resetAll() {
    setQuery("");
    setFilters(EMPTY_FILTERS);
  }

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        let data = await getListings({
          department: filters.department,
          semester: filters.semester,
          category: filters.category,
        });
        if (filters.minPrice !== "" || filters.maxPrice !== "") {
          data = data.filter((item) => matchesPriceRange(item, filters.minPrice, filters.maxPrice));
        }
        if (query.trim() && data.length) {
          try {
            const { ids } = await rankTitles(query.trim(), data);
            const byId = new Map(data.map((l) => [l.id, l]));
            data = ids.map((id) => byId.get(id)).filter(Boolean);
          } catch {
            data = data.filter((l) => l.title.toLowerCase().includes(query.trim().toLowerCase()));
          }
        }
        if (!cancelled) setListings(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters, query]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="animate-fade-up mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink dark:text-zinc-100">
            Campus Marketplace
          </h1>
          <p className="mt-1 text-sm text-slate2 dark:text-zinc-400">
            Find textbooks, notes, calculators, and lab kits by B.Tech branch, semester, and budget.
          </p>
        </div>
        {!loading && !error && (
          <span className="rounded-full border border-rule bg-white px-3 py-1 text-xs font-medium text-slate2 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            {listings.length} {listings.length === 1 ? "listing" : "listings"}
          </span>
        )}
      </div>

      <div className="animate-fade-up mb-7 rounded-2xl border border-rule bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-2.5 md:grid-cols-6">
          <label className="relative md:col-span-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate2 dark:text-zinc-500" />
            <input
              className="field pl-9"
              placeholder="Search books, notes, kits…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <select className="field" value={filters.department} onChange={setFilter("department")} aria-label="B.Tech Branch">
            <option value="">All branches</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>B.Tech {d}</option>
            ))}
          </select>

          <select className="field" value={filters.semester} onChange={setFilter("semester")} aria-label="Semester">
            <option value="">All semesters</option>
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>

          <select className="field" value={filters.category} onChange={setFilter("category")} aria-label="Category">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <input
              className="field"
              type="number"
              min="0"
              placeholder="Min ₹"
              aria-label="Minimum price"
              value={filters.minPrice}
              onChange={setFilter("minPrice")}
            />
            <input
              className="field"
              type="number"
              min="0"
              placeholder="Max ₹"
              aria-label="Maximum price"
              value={filters.maxPrice}
              onChange={setFilter("maxPrice")}
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-2.5 flex justify-end">
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate2 hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <RotateCcw size={12} /> Clear filters
            </button>
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {loading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-72 animate-pulse rounded-2xl border border-rule bg-white dark:border-zinc-800 dark:bg-zinc-900" />
          ))}
        </div>
      )}

      {!loading && !error && listings.length === 0 && (
        <div className="rounded-2xl border border-dashed border-rule bg-white py-14 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-ink dark:text-zinc-100">No items match your filters yet</p>
          <p className="mt-1 text-xs text-slate2 dark:text-zinc-400">
            Try clearing a filter or post the first listing for this branch.
          </p>
          {hasActiveFilters && (
            <button type="button" onClick={resetAll} className="btn-ghost mt-4">
              Reset filters
            </button>
          )}
        </div>
      )}

      {!loading && listings.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l, idx) => (
            <ListingCard key={l.id} listing={l} index={idx} onOpenChat={onOpenChat} />
          ))}
        </div>
      )}
    </section>
  );
}
