import axios from "axios";

const BASE_URL = "http://localhost:8183/api";

const api = axios.create({
  baseURL: BASE_URL,
});

// ✅ 요청 인터셉터 - 토큰 자동 첨부
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ 응답 인터셉터 - 토큰 만료 시 Refresh 요청
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // AccessToken 만료 (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        console.warn("⚠️ Refresh token 없음, 로그인 필요");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });

        const newAccessToken = res.data.accessToken;
        localStorage.setItem("accessToken", newAccessToken);

        // 새 토큰으로 재요청
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        console.error("❌ 토큰 재발급 실패:", refreshErr);
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
