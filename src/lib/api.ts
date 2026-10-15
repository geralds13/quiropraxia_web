import axios from "axios";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export const COMPANY_SLUG =
  process.env.NEXT_PUBLIC_COMPANY_SLUG ?? "quiropraxia";

/** Cliente Axios apuntando al backend Django (módulo wellness). */
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15_000,
  headers: { Accept: "application/json" },
});