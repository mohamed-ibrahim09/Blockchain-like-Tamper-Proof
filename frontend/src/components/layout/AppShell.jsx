import { motion } from "framer-motion";
import { Activity, Blocks, ChartColumnBig, CirclePlus, Info, ShieldCheck, Home } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { ThemeToggle } from "../ui/ThemeToggle";

const navigation = [
  { to: "/", label: "Home", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: Activity },
  { to: "/create", label: "Create Log", icon: CirclePlus },
  { to: "/chain", label: "Chain Viewer", icon: Blocks },
  { to: "/verification", label: "Verification", icon: ShieldCheck },
  { to: "/statistics", label: "Statistics", icon: ChartColumnBig },
  { to: "/about", label: "About", icon: Info },
];

export function AppShell({ children }) {
  const location = useLocation();

  return (
    <div className="app-shell">
      <header className="shell-header">
        <div className="container nav-bar">
          <Link className="brand" to="/">
            <span className="brand-mark">SL</span>
            <span className="brand-copy">
              <strong>SecureLog</strong>
            </span>
          </Link>

          <nav className="top-nav" aria-label="Primary">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  className={({ isActive }) => `top-nav-link ${isActive ? "active" : ""}`}
                  to={item.to}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="nav-side">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="shell-main">
        <motion.div
          key={location.pathname}
          className="container page-frame"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {children}
        </motion.div>
        <div className="container">
          <footer className="shell-footer">
            SecureLog — Blockchain-Powered Tamper-Proof Logging &middot; University Project
          </footer>
        </div>
      </main>
    </div>
  );
}
