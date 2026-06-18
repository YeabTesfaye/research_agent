import axios, { type AxiosError } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
let _refreshing = false;
let _refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refresh = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
      if (!refresh) {
        _redirectToLogin();
        return Promise.reject(error);
      }

      if (_refreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          _refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      _refreshing = true;
      try {
        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refresh_token: refresh,
        });
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);

        _refreshQueue.forEach((cb) => cb(data.access_token));
        _refreshQueue = [];

        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        _redirectToLogin();
        return Promise.reject(error);
      } finally {
        _refreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function _redirectToLogin() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
  }
}

export default api;

// Typed API helpers
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/api/auth/login", { email, password }),
  register: (email: string, password: string, full_name?: string) =>
    api.post("/api/auth/register", { email, password, full_name }),
  me: () => api.get("/api/auth/me"),
  updateProfile: (data: { full_name?: string; bio?: string; avatar_url?: string }) =>
    api.patch("/api/auth/profile", data),
  updatePreferences: (data: {
    email_notifications?: boolean;
    report_complete_email?: boolean;
    weekly_digest?: boolean;
  }) => api.patch("/api/auth/preferences", data),
  changePassword: (current_password: string, new_password: string) =>
    api.post("/api/auth/change-password", { current_password, new_password }),
  deleteAccount: (password: string) =>
    api.delete("/api/auth/account", { data: { password, confirmation: "DELETE" } }),
  checkPasswordStrength: (password: string) =>
    api.get("/api/auth/password-strength", { params: { password } }),
  forgotPassword: (email: string) =>
    api.post("/api/auth/forgot-password", { email }),
  resetPassword: (token: string, new_password: string) =>
    api.post("/api/auth/reset-password", { token, new_password }),
};

export const reportsApi = {
  list: () => api.get("/api/reports/"),
  get: (id: number) => api.get(`/api/reports/${id}`),
  create: (topic: string) => api.post("/api/reports/", { topic }),
  delete: (id: number) => api.delete(`/api/reports/${id}`),
};
