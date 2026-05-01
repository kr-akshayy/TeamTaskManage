import axios from "axios";

function defaultApiUrl() {
  // Production on Railway typically serves the SPA from the API (same-origin).
  // In local dev, the API runs on :4000.
  if (typeof window !== "undefined" && window.location?.hostname === "localhost") return "http://localhost:4000";
  return "";
}

const API_URL = import.meta.env.VITE_API_URL ?? defaultApiUrl();

export const api = axios.create({
  // If VITE_API_URL is set to "", axios will use same-origin (works when API serves the built web).
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tm_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

