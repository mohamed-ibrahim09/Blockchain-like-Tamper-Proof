import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Eye, EyeOff, ArrowRight, UserPlus, LogIn, Moon, Sun } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { login, register } from "../lib/api";
import { handleAuthResponse } from "../lib/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect theme preference on mount (stored > system > default)
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    // Determine initial theme: stored preference > system preference > light
    const shouldBeDark = storedTheme 
      ? storedTheme === "dark"
      : mediaQuery.matches;
    
    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    
    // Listen for system changes (only if no stored preference)
    const handleChange = (e) => {
      if (!localStorage.getItem("theme")) {
        setIsDarkMode(e.matches);
        if (e.matches) {
          document.documentElement.setAttribute("data-theme", "dark");
        } else {
          document.documentElement.removeAttribute("data-theme");
        }
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Manual theme toggle handler
  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  };

  // Login form state
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    username: "",
    first_name: "",
    password: "",
    confirm_password: "",
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await login(loginData);
      handleAuthResponse(response);
      navigate("/"); // Redirect to home page after login
    } catch (err) {
      setError(
        err.response?.data?.detail || "Login failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validation
    if (registerData.password !== registerData.confirm_password) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }
    if (registerData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    try {
      const response = await register(registerData);
      handleAuthResponse(response);
      navigate("/"); // Redirect to home page after login
    } catch (err) {
      setError(
        err.response?.data?.detail || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-frame" style={{ minHeight: "calc(100vh - 200px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="section-card"
        style={{ width: "100%", maxWidth: "440px", padding: "2.5rem" }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "18px",
              background: "var(--accent-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
              color: "#ffffff",
            }}
          >
            <Shield size={32} />
          </div>
          <h1 className="page-title" style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>
            SecureLog
          </h1>
          <p className="page-description">
            Blockchain-Powered Tamper-Proof Logging
          </p>
          
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              borderRadius: "999px",
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--text)",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 0.2s ease, border-color 0.2s ease",
            }}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        {/* Toggle Tabs */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            padding: "0.35rem",
            background: "var(--surface)",
            borderRadius: "999px",
            border: "1px solid var(--border)",
            marginBottom: "1.5rem",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError("");
            }}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.75rem 1rem",
              borderRadius: "999px",
              border: "none",
              background: isLogin ? "var(--text-strong)" : "transparent",
              color: isLogin ? "var(--surface)" : "var(--text)",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <LogIn size={16} />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError("");
            }}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.75rem 1rem",
              borderRadius: "999px",
              border: "none",
              background: !isLogin ? "var(--text-strong)" : "transparent",
              color: !isLogin ? "var(--surface)" : "var(--text)",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <UserPlus size={16} />
            Register
          </button>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="inline-feedback tone-danger"
              style={{ marginBottom: "1rem" }}
            >
              <strong>Authentication Error</strong>
              <p style={{ margin: 0 }}>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Form */}
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleLoginSubmit}
              className="form-stack"
            >
              <label className="field">
                <span className="field-label">Username</span>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={loginData.username}
                  onChange={(e) =>
                    setLoginData({ ...loginData, username: e.target.value })
                  }
                  required
                  disabled={isLoading}
                />
              </label>

              <label className="field">
                <span className="field-label">Password</span>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                    required
                    disabled={isLoading}
                    style={{ paddingRight: "3rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "1rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--muted)",
                      cursor: "pointer",
                      padding: "0.25rem",
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                className="primary-button"
                disabled={isLoading}
                style={{ marginTop: "0.5rem" }}
              >
                {isLoading ? (
                  <span className="spin" style={{ display: "inline-block" }}>
                    <ArrowRight size={18} style={{ opacity: 0 }} />
                  </span>
                ) : (
                  <ArrowRight size={18} />
                )}
                Sign In
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleRegisterSubmit}
              className="form-stack"
            >
              <div className="field-row">
                <label className="field">
                  <span className="field-label">Username</span>
                  <input
                    type="text"
                    placeholder="Choose a username"
                    value={registerData.username}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, username: e.target.value })
                    }
                    required
                    disabled={isLoading}
                    pattern="[a-zA-Z0-9_]+"
                    title="Only letters, numbers, and underscores allowed"
                  />
                </label>

                <label className="field">
                  <span className="field-label">First Name</span>
                  <input
                    type="text"
                    placeholder="Your first name"
                    value={registerData.first_name}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, first_name: e.target.value })
                    }
                    required
                    disabled={isLoading}
                  />
                </label>
              </div>

              <label className="field">
                <span className="field-label">Password</span>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password (min 8 chars)"
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, password: e.target.value })
                    }
                    required
                    disabled={isLoading}
                    minLength={8}
                    style={{ paddingRight: "3rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "1rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--muted)",
                      cursor: "pointer",
                      padding: "0.25rem",
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <label className="field">
                <span className="field-label">Confirm Password</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={registerData.confirm_password}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, confirm_password: e.target.value })
                  }
                  required
                  disabled={isLoading}
                  style={{ paddingRight: "3rem" }}
                />
              </label>

              <button
                type="submit"
                className="primary-button"
                disabled={isLoading}
                style={{ marginTop: "0.5rem" }}
              >
                {isLoading ? (
                  <span className="spin" style={{ display: "inline-block" }}>
                    <ArrowRight size={18} style={{ opacity: 0 }} />
                  </span>
                ) : (
                  <UserPlus size={18} />
                )}
                Create Account
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <p className="page-description" style={{ fontSize: "0.8rem" }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--link)",
                cursor: "pointer",
                fontWeight: 600,
                padding: 0,
              }}
            >
              {isLogin ? "Register now" : "Sign in"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
