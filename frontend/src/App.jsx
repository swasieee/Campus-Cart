import { useState } from "react";
import { LogOut, Plus, Store } from "lucide-react";
import AuthForm from "./components/AuthForm.jsx";
import Marketplace from "./components/Marketplace.jsx";
import PostItemForm from "./components/PostItemForm.jsx";

function loadUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState(loadUser);
  const [view, setView] = useState("market");

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setView("market");
  }

  return (
    <div className="min-h-screen bg-chalk text-ink">
      <header className="sticky top-0 z-20 border-b border-rule bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <button
            type="button"
            className="flex items-center gap-2.5 text-left"
            onClick={() => setView("market")}
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-white">
              <Store size={16} />
            </span>
            <span>
              <span className="block font-display text-base font-bold tracking-tight">Campus Cart</span>
              <span className="hidden text-[11px] text-slate2 sm:block">B.Tech student marketplace</span>
            </span>
          </button>

          <nav className="flex items-center gap-2.5">
            {view !== "market" && (
              <button type="button" className="btn-ghost" onClick={() => setView("market")}>
                Browse
              </button>
            )}
            {user ? (
              <>
                <span className="hidden items-center gap-1.5 rounded-full border border-rule bg-chalk px-3 py-1 text-xs font-medium text-slate2 md:inline-flex">
                  <span className="text-ink">{user.name}</span>
                  <span>·</span>
                  <span>B.Tech {user.department}</span>
                  <span>·</span>
                  <span>Sem {user.semester}</span>
                </span>
                <button type="button" className="btn" onClick={() => setView("post")}>
                  <Plus size={15} /> Post item
                </button>
                <button
                  type="button"
                  className="btn-ghost px-2.5"
                  onClick={logout}
                  aria-label="Log out"
                  title="Log out"
                >
                  <LogOut size={15} />
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn-ghost" onClick={() => setView("post")}>
                  <Plus size={15} /> Sell item
                </button>
                <button type="button" className="btn" onClick={() => setView("auth")}>
                  Log in
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="pb-14">
        {view === "market" && <Marketplace />}
        {view === "auth" && (
          <AuthForm
            onAuth={(u) => {
              setUser(u);
              setView("market");
            }}
          />
        )}
        {view === "post" &&
          (user ? (
            <PostItemForm user={user} onPosted={() => setView("market")} />
          ) : (
            <AuthForm
              notice="Log in or create an account with your Gmail or college email to post an item."
              onAuth={(u) => {
                setUser(u);
                setView("post");
              }}
            />
          ))}
      </main>
    </div>
  );
}
