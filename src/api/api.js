import axios from "axios";

const BASE_URL = "http://210.110.33.220:8183/api";

// ✅ 공통 인스턴스
const instance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// ✅ 요청 인터셉터: JWT 자동 부착
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ 응답 인터셉터: 401 시 refresh 재발급 시도
instance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("리프레시 토큰 없음");
        const res = await axios.post(`${BASE_URL}/refresh`, { refreshToken });
        const newAccess = res.data?.accessToken;
        if (!newAccess) throw new Error("새 accessToken 없음");
        localStorage.setItem("accessToken", newAccess);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return instance(original);
      } catch (e) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

/* ======================
 *  Auth / Profile
 * ====================== */
export const signup = (email, username, password, confirmPassword) =>
  instance.post("/signup", { email, username, password, confirmPassword });

export const login = async (email, password) => {
  const res = await instance.post("/login", { email, password });
  localStorage.setItem("accessToken", res.data.accessToken);
  localStorage.setItem("refreshToken", res.data.refreshToken);
  return res.data;
};

export const logout = async () => {
  try { await instance.post("/logout"); } catch {}
  finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
};

export const getProfile = () => instance.get("/profile");
export const updateProfile = (data) => instance.put("/profile", data);

/* ======================
 *  Board
 * ====================== */
export const getAllBoards = () => instance.get("/board");
export const createBoard = (title, content) =>
  instance.post("/board", { title, content });
export const updateBoard = (boardId, title, content) =>
  instance.put(`/board/${boardId}`, { title, content });
export const deleteBoard = (boardId) => instance.delete(`/board/${boardId}`);

/* ======================
 *  Favorites
 * ====================== */
export const getFavorites = () => instance.get("/favorites/my");
export const addFavorite = (recipeId) => instance.post("/favorites", { recipeId });
export const removeFavorite = (recipeId) => instance.delete(`/favorites/${recipeId}`);

/* ======================
 *  Ratings
 * ====================== */
export const getMyRatings = () => instance.get("/rating/my");

/* ======================
 *  Recipes (기존 검색/상세 등 필요시)
 * ====================== */
export const getRecipeById = (id) => instance.get(`/recipe/${id}`);

/* ======================
 *  AI 모드 (백엔드 /api/ai 에 맞춤)
 * ====================== */
// 1) 세션 시작 (선호/제약/재료를 한 번에 보낼 수도 있고, 비워도 됨)
export const aiStart = (payload = {}) => instance.post("/ai/start", payload);

// 2) 알러지 추가 (여러 개면 여러 번 호출)
export const aiSetAllergy = (sessionId, allergy) =>
  instance.post(`/ai/allergy`, null, { params: { sessionId, allergy } });

// 3) 난이도 지정
export const aiSetDifficulty = (sessionId, difficulty) =>
  instance.post(`/ai/difficulty`, null, { params: { sessionId, difficulty } });

// 4) 재료 입력 → 추천 리턴(RecipeRecommendationResponse)
export const aiSetIngredientsAndRecommend = (sessionId, ingredients) =>
  instance.post(`/ai/ingredients`, null, { params: { sessionId, ingredients } });

// 5) 추천된 음식 상세
export const aiRecipeDetailByName = (foodName) =>
  instance.get(`/ai/recipe/detail`, { params: { foodName } });

// (원샷 기존 방식 필요시 유지)
export const aiRecommendOneShot = (ingredients) =>
  instance.get("/ai/recommend", { params: { ingredients } });

export default instance;
