import { useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { createListing, uploadImages } from "../api.js";
import { CATEGORIES, DEPARTMENTS, LISTING_TYPES, SEMESTERS } from "../lib/constants.js";

const MAX_PHOTOS = 4;

export default function PostItemForm({ user, onPosted }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priceMin: "",
    priceMax: "",
    listingType: "SELL",
    category: "Books",
    department: user?.department || "CSE",
    semester: user?.semester || 3,
  });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function pickFiles(e) {
    const chosen = [...e.target.files];
    if (!chosen.length) return;
    setFiles((prev) => [...prev, ...chosen].slice(0, MAX_PHOTOS));
    e.target.value = "";
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");

    const minVal = form.priceMin === "" ? 0 : Number(form.priceMin);
    const maxVal = form.priceMax === "" ? minVal : Number(form.priceMax);

    if (form.listingType === "SELL" && form.priceMin === "") {
      return setError("Enter at least a starting price (use 0 for free items).");
    }
    if (minVal < 0 || maxVal < 0) {
      return setError("Price cannot be negative.");
    }
    if (form.priceMax !== "" && maxVal < minVal) {
      return setError("Maximum price must be greater than or equal to minimum price.");
    }

    setBusy(true);
    try {
      const imageUrls = files.length ? await uploadImages(files) : [];
      await createListing({
        title: form.title.trim(),
        description: form.description.trim(),
        listingType: form.listingType,
        category: form.category,
        department: form.department,
        semester: Number(form.semester),
        price: minVal,
        priceMin: minVal,
        priceMax: maxVal,
        imageUrls,
      });
      onPosted();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-pop-in mx-auto mt-8 max-w-xl px-4">
      <form
        onSubmit={submit}
        className="space-y-5 rounded-2xl border border-rule bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-7"
      >
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight">List an item</h1>
          <p className="mt-1 text-sm text-slate2 dark:text-zinc-400">
            Tag your B.Tech branch, semester, price range, and description so classmates can find it easily.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="post-title">Item title</label>
          <input
            id="post-title"
            className="field"
            placeholder="e.g. Morris Mano Digital Design (5th ed.)"
            value={form.title}
            onChange={set("title")}
            required
            maxLength={120}
          />
        </div>

        <div>
          <label className="label" htmlFor="post-desc">Description</label>
          <textarea
            id="post-desc"
            className="field min-h-24 resize-y"
            placeholder="Condition, edition, included accessories, or pickup spot on campus"
            value={form.description}
            onChange={set("description")}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="post-branch">B.Tech Branch</label>
            <select id="post-branch" className="field" value={form.department} onChange={set("department")}>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="post-sem">Semester</label>
            <select id="post-sem" className="field" value={form.semester} onChange={set("semester")}>
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="post-cat">Category</label>
            <select id="post-cat" className="field" value={form.category} onChange={set("category")}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="post-type">Listing type</label>
            <select id="post-type" className="field" value={form.listingType} onChange={set("listingType")}>
              {LISTING_TYPES.map((t) => (
                <option key={t} value={t}>{t === "SELL" ? "Sell" : "Exchange / Swap"}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="post-min">
              {form.listingType === "SELL" ? "Min price (₹)" : "Est. min value (₹, optional)"}
            </label>
            <input
              id="post-min"
              className="field"
              type="number"
              min="0"
              placeholder="e.g. 250"
              value={form.priceMin}
              onChange={set("priceMin")}
              required={form.listingType === "SELL"}
            />
          </div>
          <div>
            <label className="label" htmlFor="post-max">Max price (₹, optional)</label>
            <input
              id="post-max"
              className="field"
              type="number"
              min="0"
              placeholder="e.g. 400"
              value={form.priceMax}
              onChange={set("priceMax")}
            />
          </div>
        </div>

        <div>
          <label className="label">Photos (optional, up to {MAX_PHOTOS})</label>
          <label className="btn-ghost w-full cursor-pointer justify-center border-dashed py-3">
            <ImagePlus size={16} />
            <span>{files.length ? `${files.length} / ${MAX_PHOTOS} photo(s) selected` : "Upload JPEG, PNG, or WebP"}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={pickFiles} />
          </label>

          {previews.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2.5">
              {previews.map((src, idx) => (
                <div key={src} className="relative h-16 w-16 overflow-hidden rounded-lg border border-rule dark:border-zinc-700">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    aria-label="Remove photo"
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink/80 text-white hover:bg-ink"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </p>
        )}

        <button className="btn w-full py-2.5" disabled={busy}>
          {busy ? "Publishing…" : "Publish listing"}
        </button>
      </form>
    </div>
  );
}
