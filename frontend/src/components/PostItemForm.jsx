import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { createListing, uploadImages } from "../api.js";
import { CATEGORIES, DEPARTMENTS, LISTING_TYPES, SEMESTERS } from "../lib/constants.js";

const MAX_PHOTOS = 4;

export default function PostItemForm({ onPosted }) {
  const [form, setForm] = useState({
    title: "", description: "", price: "", listingType: "SELL",
    category: "Books", department: "CSE", semester: 3,
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function pickFiles(e) {
    setFiles([...e.target.files].slice(0, MAX_PHOTOS));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const imageUrls = files.length ? await uploadImages(files) : [];
      await createListing({
        ...form,
        price: form.listingType === "SELL" ? Number(form.price) : 0,
        semester: Number(form.semester),
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
    <form onSubmit={submit} className="mx-auto mt-8 max-w-xl space-y-4 rounded-lg border border-rule bg-white p-6">
      <h2 className="font-display text-2xl font-bold">Post an item</h2>
      <input className="field" placeholder="Title, e.g. Morris Mano Digital Design (5th ed.)" value={form.title} onChange={set("title")} required maxLength={120} />
      <textarea className="field min-h-24" placeholder="Condition, edition, anything a buyer should know" value={form.description} onChange={set("description")} required />

      <div className="grid grid-cols-2 gap-3">
        <select className="field" value={form.listingType} onChange={set("listingType")}>
          {LISTING_TYPES.map((t) => <option key={t} value={t}>{t === "SELL" ? "Sell" : "Exchange"}</option>)}
        </select>
        {form.listingType === "SELL" && (
          <input className="field" type="number" min="0" placeholder="Price in ₹" value={form.price} onChange={set("price")} required />
        )}
        <select className="field" value={form.category} onChange={set("category")}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="field" value={form.department} onChange={set("department")}>
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select className="field" value={form.semester} onChange={set("semester")}>
          {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>

      <label className="btn-ghost cursor-pointer">
        <ImagePlus size={16} /> {files.length ? `${files.length} photo(s) selected` : `Add up to ${MAX_PHOTOS} photos`}
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={pickFiles} />
      </label>
      {files.length > 0 && (
        <div className="flex gap-2">
          {files.map((f) => (
            <img key={f.name} src={URL.createObjectURL(f)} alt="" className="h-16 w-16 rounded object-cover" />
          ))}
        </div>
      )}

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button className="btn w-full" disabled={busy}>{busy ? "Publishing…" : "Publish listing"}</button>
    </form>
  );
}
