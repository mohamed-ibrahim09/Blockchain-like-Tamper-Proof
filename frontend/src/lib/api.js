import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
});

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
