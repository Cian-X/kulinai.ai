import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://kulinai-production-f20f.up.railway.app";

export const api = axios.create({
  baseURL: API_BASE,
});
