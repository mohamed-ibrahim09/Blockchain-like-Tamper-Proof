/**
 * Authentication utilities for SecureLog frontend.
 * Handles JWT tokens, user session, and authentication state.
 */

const TOKEN_KEY = "sl_token";

/**
 * Get the stored JWT token from localStorage.
 * @returns {string|null} The JWT token or null if not found.
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store the JWT token in localStorage.
 * @param {string} token - The JWT token to store.
 */
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove the JWT token from localStorage (logout).
 */
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Decode a JWT token payload (without verification).
 * @param {string} token - The JWT token to decode.
 * @returns {Object|null} The decoded payload or null if invalid.
 */
export function decodeToken(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Get the current user from the stored token.
 * @returns {{user_id: number, username: string, first_name: string}|null} User object or null.
 */
export function getUser() {
  const token = getToken();
  if (!token) return null;

  const payload = decodeToken(token);
  if (!payload) return null;

  // Check if token is expired
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    removeToken();
    return null;
  }

  // Return user info from the stored user data in the token response
  // The token payload contains 'sub' (user_id) but we also need username/first_name
  // We store the full user object separately or extract from localStorage custom data
  const userData = localStorage.getItem("sl_user");
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Store user data in localStorage.
 * @param {Object} user - The user object to store.
 */
export function setUser(user) {
  localStorage.setItem("sl_user", JSON.stringify(user));
}

/**
 * Remove user data from localStorage.
 */
export function removeUser() {
  localStorage.removeItem("sl_user");
}

/**
 * Check if the user is authenticated (token exists and is not expired).
 * @returns {boolean} True if authenticated.
 */
export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;

  const payload = decodeToken(token);
  if (!payload) return false;

  // Check expiration
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    logout();
    return false;
  }

  return true;
}

/**
 * Log out the current user and redirect to login page.
 */
export function logout() {
  removeToken();
  removeUser();
  window.location.href = "/login";
}

/**
 * Handle authentication response from API.
 * @param {Object} response - The API response containing token and user.
 */
export function handleAuthResponse(response) {
  if (response.access_token) {
    setToken(response.access_token);
  }
  if (response.user) {
    setUser(response.user);
  }
}
