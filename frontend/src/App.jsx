import { useState } from "react";
import { BookOpen, LogOut, PlusCircle } from "lucide-react";
import AuthForm from "./components/AuthForm.jsx";
import Marketplace from "./components/Marketplace.jsx";
import PostItemForm from "./components/PostItemForm.jsx";

function loadUser() {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
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
    <div className="min-h-screen">
      <header className="border-b border-rule bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <button className="flex items-center gap-2 font-display text-xl font-extrabold" onClick={() => setView("market")}>
            <BookOpen size={22} /> Campus Exchange
          </button>
          <nav className="flex items-center gap-2">
            {user ? (
              <>
                <button className="btn" onClick={() => setView("post")}><PlusCircle size={16} /> Post item</button>
                <button className="btn-ghost" onClick={logout} aria-label="Log out"><LogOut size={16} /></button>
              </>
            ) : (
              <button className="btn" onClick={() => setView("auth")}>Log in</button>
            )}
          </nav>
        </div>
      </header>

      {view === "market" && <Marketplace />}
      {view === "auth" && <AuthForm onAuth={(u) => { setUser(u); setView("market"); }} />}
      {view === "post" && (user ? <PostItemForm onPosted={() => setView("market")} /> : <AuthForm onAuth={(u) => { setUser(u); setView("post"); }} />)}
    </div>
  );
}
