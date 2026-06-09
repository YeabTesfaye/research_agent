import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8000" });

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh =
        typeof window !== "undefined"
          ? localStorage.getItem("refresh_token")
          : null;
      if (refresh) {
        try {
          const { data } = await axios.post(
            "http://localhost:8000/api/auth/refresh",
            { refresh_token: refresh }
          );
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          error.config.headers.Authorization = `Bearer ${data.access_token}`;
          return api(error.config);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
