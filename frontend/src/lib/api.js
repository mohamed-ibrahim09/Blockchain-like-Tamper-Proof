import axios from "axios";
import { getToken, logout } from "./auth";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
});

// Request interceptor - add JWT token to Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 errors by redirecting to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - logout and redirect
      logout();
    }
    return Promise.reject(error);
  }
);

async function optionalGet(path, fallback) {
  try {
    const { data } = await apiClient.get(path);
    return data;
  } catch (error) {
    if (error.response?.status === 404) {
      return fallback;
    }
    throw error;
  }
}

export async function fetchLogs() {
  const { data } = await apiClient.get("/logs");
  return data;
}

export async function fetchLog(id) {
  const { data } = await apiClient.get(`/logs/${id}`);
  return data;
}

export async function createLog(payload) {
  const { data } = await apiClient.post("/logs", payload);
  return data;
}

export async function decryptLog(id, payload) {
  const { data } = await apiClient.post(`/logs/${id}/decrypt`, payload);
  return data;
}

export async function tamperLog(id, payload) {
  const { data } = await apiClient.post(`/logs/${id}/tamper`, payload);
  return data;
}

export async function verifyChain() {
  const { data } = await apiClient.post("/chain/verify");
  return data;
}

export async function fetchChainWarnings() {
  return optionalGet("/chain/warnings", { items: [] });
}

export async function resetChainData() {
  const { data } = await apiClient.post("/chain/reset");
  return data;
}

export async function fetchComparisonMetrics() {
  const { data } = await apiClient.get("/comparison/metrics");
  return data;
}

// Authentication endpoints

export async function login(credentials) {
  const { data } = await apiClient.post("/auth/login", credentials);
  return data;
}

export async function register(userData) {
  const { data } = await apiClient.post("/auth/register", userData);
  return data;
}

export async function fetchCurrentUser() {
  const { data } = await apiClient.get("/auth/me");
  return data;
}

// Cryptography endpoints

export async function fetchSignatureKeyInfo() {
  const { data } = await apiClient.get("/crypto/signatures/key-info");
  return data;
}

export async function generateSigningKey() {
  const { data } = await apiClient.post("/crypto/signatures/generate-key");
  return data;
}

export async function verifyBlockSignature(logId) {
  const { data } = await apiClient.post(`/crypto/signatures/verify/${logId}`);
  return data;
}

export async function fetchMerkleTreeInfo() {
  const { data } = await apiClient.get("/crypto/merkle/tree");
  return data;
}

export async function fetchMerkleProof(logId) {
  const { data } = await apiClient.get(`/crypto/merkle/proof/${logId}`);
  return data;
}

export async function verifyMerkleProof(payload) {
  const { data } = await apiClient.post("/crypto/merkle/verify", payload);
  return data;
}

export async function fetchKeyStatus() {
  const { data } = await apiClient.get("/crypto/keys/status");
  return data;
}

export async function rotateSigningKey(reason) {
  const { data } = await apiClient.post("/crypto/keys/rotate", { reason });
  return data;
}

export async function checkKeyHealth() {
  const { data } = await apiClient.get("/crypto/keys/health");
  return data;
}

// Alert endpoints

export async function testEmailAlert(toEmail, message = "test") {
  const { data } = await apiClient.post("/alerts/test/email", null, {
    params: { to_email: toEmail, message },
  });
  return data;
}

export async function testWebhookAlert() {
  const { data } = await apiClient.post("/alerts/test/webhook");
  return data;
}

export async function fetchAlertConfig() {
  const { data } = await apiClient.get("/alerts/config");
  return data;
}

export async function fetchAlertStatus() {
  const { data } = await apiClient.get("/alerts/status");
  return data;
}

export async function saveAlertConfig(config) {
  const { data } = await apiClient.post("/alerts/config", config);
  return data;
}
