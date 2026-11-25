import { useState } from "react";
import { register, login } from "../api.js";
import { CAMPUS_EMAIL_REGEX, DEPARTMENTS, SEMESTERS } from "../lib/constants.js";

export default function AuthForm({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", department: "CSE", semester: 3, phone: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const emailOk = CAMPUS_EMAIL_REGEX.test(form.email);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!emailOk) return setError("Use your campus email ending in @college.edu.");
    setBusy(true);
    try {
      const data =
        mode === "login"
          ? await login({ email: form.email, password: form.password })
          : await register({ ...form, semester: Number(form.semester) });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-10 max-w-md space-y-4 rounded-lg border border-rule bg-white p-6">
      <h2 className="font-display text-2xl font-bold">{mode === "login" ? "Log in" : "Create your account"}</h2>

      {mode === "register" && (
        <>
          <input className="field" placeholder="Full name" value={form.name} onChange={set("name")} required />
          <div className="grid grid-cols-2 gap-3">
            <select className="field" value={form.department} onChange={set("department")}>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
            <select className="field" value={form.semester} onChange={set("semester")}>
              {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
          <input className="field" placeholder="WhatsApp number with country code, e.g. 919876543210"
                 value={form.phone} onChange={set("phone")} required inputMode="numeric" />
        </>
      )}

      <div>
        <input className="field" type="email" placeholder="you@college.edu" value={form.email} onChange={set("email")} required />
        {form.email && !emailOk && <p className="mt-1 text-xs text-red-700">Only @college.edu addresses can sign up.</p>}
      </div>
      <input className="field" type="password" placeholder="Password" value={form.password} onChange={set("password")} required minLength={8} />

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button className="btn w-full" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}</button>

      <button type="button" className="text-sm text-slate2 underline" onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? "New here? Create an account" : "Already registered? Log in"}
      </button>
    </form>
  );
}
