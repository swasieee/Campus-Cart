import { useState } from "react";
import { Sparkles } from "lucide-react";
import { login, register } from "../api.js";
import { DEPARTMENTS, EMAIL_REGEX, SEMESTERS } from "../lib/constants.js";

export default function AuthForm({ onAuth, notice }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "CSE",
    semester: 3,
    phone: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const emailOk = EMAIL_REGEX.test(form.email.trim());

  async function completeAuth(authPromise) {
    setError("");
    setBusy(true);
    try {
      const data = await authPromise;
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function submit(e) {
    e.preventDefault();
    if (!emailOk) {
      return setError("Please enter a valid email address (e.g. name@gmail.com).");
    }
    const email = form.email.trim();
    const action =
      mode === "login"
        ? login({ email, password: form.password })
        : register({ ...form, email, semester: Number(form.semester) });
    return completeAuth(action);
  }

  return (
    <div className="animate-pop-in mx-auto mt-10 max-w-md px-4">
      <form
        onSubmit={submit}
        className="space-y-4 rounded-2xl border border-rule bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-7"
      >
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-slate2 dark:text-zinc-400">
            {notice || "Sign in with your Gmail or college email."}
          </p>
        </div>

        {mode === "register" && (
          <>
            <div>
              <label className="label" htmlFor="auth-name">Full name</label>
              <input
                id="auth-name"
                className="field"
                placeholder="Your full name"
                value={form.name}
                onChange={set("name")}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="auth-branch">B.Tech Branch</label>
                <select id="auth-branch" className="field" value={form.department} onChange={set("department")}>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="auth-sem">Semester</label>
                <select id="auth-sem" className="field" value={form.semester} onChange={set("semester")}>
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="auth-phone">WhatsApp number (with country code)</label>
              <input
                id="auth-phone"
                className="field"
                placeholder="e.g. 919876543210"
                value={form.phone}
                onChange={set("phone")}
                required
                inputMode="numeric"
              />
            </div>
          </>
        )}

        <div>
          <label className="label" htmlFor="auth-email">Email address</label>
          <input
            id="auth-email"
            className="field"
            type="email"
            placeholder="you@gmail.com"
            value={form.email}
            onChange={set("email")}
            required
          />
          {form.email && !emailOk && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              Enter a valid email address (Gmail or college email).
            </p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            className="field"
            type="password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={set("password")}
            required
            minLength={8}
          />
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
          {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
        </button>

        {mode === "login" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => completeAuth(login({ email: "aarav@gmail.com", password: "campus1234" }))}
            className="btn-ghost w-full text-xs"
          >
            <Sparkles size={14} /> Quick Demo Login (aarav@gmail.com)
          </button>
        )}

        <div className="border-t border-rule pt-3 text-center dark:border-zinc-800">
          <button
            type="button"
            className="text-xs font-medium text-slate2 hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-100"
            onClick={() => {
              setError("");
              setMode(mode === "login" ? "register" : "login");
            }}
          >
            {mode === "login" ? "New to Campus Cart? Create an account" : "Already have an account? Log in"}
          </button>
        </div>
      </form>
    </div>
  );
}
