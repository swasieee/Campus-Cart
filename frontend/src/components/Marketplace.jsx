import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { getListings, rankTitles } from "../api.js";
import { CATEGORIES, DEPARTMENTS, SEMESTERS } from "../lib/constants.js";
import ListingCard from "./ListingCard.jsx";

export default function Marketplace() {
  const [filters, setFilters] = useState({ department: "", semester: "", category: "" });
  const [query, setQuery] = useState("");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const setFilter = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        let data = await getListings(filters);
        if (query.trim() && data.length) {
          try {
            const { ids } = await rankTitles(query.trim(), data);
            const byId = new Map(data.map((l) => [l.id, l]));
            data = ids.map((id) => byId.get(id)).filter(Boolean);
          } catch {
            // Ranking service down: fall back to simple substring filter.
            data = data.filter((l) => l.title.toLowerCase().includes(query.trim().toLowerCase()));
          }
        }
        if (!cancelled) setListings(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300); // debounce typing
    return () => { cancelled = true; clearTimeout(timer); };
  }, [filters, query]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <label className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate2" />
          <input className="field pl-9" placeholder="Search books, notes, kits…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <select className="field" value={filters.department} onChange={setFilter("department")} aria-label="Department">
          <option value="">All departments</option>
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select className="field" value={filters.semester} onChange={setFilter("semester")} aria-label="Semester">
          <option value="">All semesters</option>
          {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </select>
        <select className="field" value={filters.category} onChange={setFilter("category")} aria-label="Category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {error && <p role="alert" className="text-red-700">{error}</p>}
      {loading && <p className="text-slate2">Loading listings…</p>}
      {!loading && !error && listings.length === 0 && (
        <p className="text-slate2">Nothing matches yet. Clear a filter or post the first one.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
      </div>
    </section>
  );
}
