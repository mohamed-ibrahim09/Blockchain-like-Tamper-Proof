import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setDark((prev) => !prev)}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
