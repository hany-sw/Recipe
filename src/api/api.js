import axios from "axios";

const BASE_URL = "http://127.0.0.1:8183/api"; // 백엔드 주소

// Axios 인스턴스 생성
const instance = axios.create({
  baseURL: BASE_URL,
  headers:{
    "Content-Type": "application/json"
  }, withCredentials: true
});

// 요청 인터셉터: accessToken 자동 포함
instance.interceptors.request.use(config => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: accessToken 만료 시 refreshToken으로 갱신
instance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        const res = await axios.post(`${BASE_URL}/refresh`, { refreshToken });
        const newAccessToken = res.data.accessToken;
        localStorage.setItem("accessToken", newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return instance(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

// ✅ API 함수들
export const signup = (email, username, password,confirmPassword) =>
  instance.post("/signup", { email, username, password, confirmPassword });

export const login = async (email, password) => {
  const res = await instance.post("/login", { email, password });
  localStorage.setItem("accessToken", res.data.accessToken);
  localStorage.setItem("refreshToken", res.data.refreshToken);
  return res.data;
};

export const logout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  return instance.post("/logout");
};

export const getProfile = () => instance.get("/profile");
export const updateProfile = (data) => instance.put("/profile", data);
export const recommendRecipes = (ingredients) =>
  instance.post("/recommend", { ingredients });
export const getRecipeById = (id) => instance.get(`/recipe/${id}`);

export default instance;