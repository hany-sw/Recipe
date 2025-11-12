import axios from "axios";

const BASE_URL = "http://210.110.33.220:8183/api";

// ✅ Axios 인스턴스 생성
const instance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// ✅ 요청 인터셉터: 모든 요청에 accessToken 자동 추가
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ 응답 인터셉터: accessToken 만료 시 refreshToken으로 자동 재발급
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // accessToken 만료 (401) + 무한루프 방지
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("리프레시 토큰 없음");

        // ✅ refreshToken으로 accessToken 재발급 요청
        const res = await axios.post(`${BASE_URL}/auth/refresh`, null, {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        });

        const newAccessToken = res.data.accessToken;
        if (!newAccessToken) throw new Error("새 accessToken 없음");

        // ✅ 새 accessToken 저장 및 원래 요청 재시도
        localStorage.setItem("accessToken", newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return instance(originalRequest);
      } catch (refreshError) {
        console.error("❌ 토큰 재발급 실패:", refreshError);
        alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

//
// ✅ API 함수들
//

// 회원가입
export const signup = (email, username, password, confirmPassword) =>
  instance.post("/signup", { email, username, password, confirmPassword });

// 로그인 (access + refresh 토큰 저장)
export const login = async (email, password) => {
  const res = await instance.post("/login", { email, password });
  localStorage.setItem("accessToken", res.data.accessToken);
  localStorage.setItem("refreshToken", res.data.refreshToken);
  return res.data;
};

// 로그아웃 (로컬 토큰 제거)
export const logout = async () => {
  try {
    await instance.post("/logout");
  } catch (err) {
    console.warn("서버 로그아웃 실패 (무시 가능):", err);
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
};

// 프로필 관련
export const getProfile = () => instance.get("/profile");
export const updateProfile = (data) => instance.put("/profile", data);

// 레시피 관련
export const recommendRecipes = (ingredients) =>
  instance.post("/recommend", { ingredients });
export const getRecipeById = (id) => instance.get(`/recipe/${id}`);

// 게시판 관련
export const getAllBoards = () => instance.get("/board");
export const createBoard = (title, content) =>
  instance.post("/board", { title, content });
export const updateBoard = (boardId, title, content) =>
  instance.put(`/board/${boardId}`, { title, content });
export const deleteBoard = (boardId) => instance.delete(`/board/${boardId}`);

// 즐겨찾기 관련
export const getFavorites = () => instance.get("/favorites/my");
export const addFavorite = (recipeId) =>
  instance.post("/favorites", { recipeId });
export const removeFavorite = (recipeId) =>
  instance.delete(`/favorites/${recipeId}`);

export default instance;
