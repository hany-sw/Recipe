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
export const getTop10 = () => instance.get("/rating/top10");

/* ======================
 *  Recipes (기존 검색/상세 등 필요시)
 * ====================== */
export const getRecipeById = (id) => instance.get(`/recipes/${id}`);

// ...상단 공통 axios 인스턴스는 그대로...

// === AI 모드 ===
// 세션 시작: 바디 없이 호출
export const aiStart = () => instance.post("/ai/start");

// 선호음식: preference (foodPreference 아님!)
export const aiSetFoodPreference = (sessionId, preference) =>
  instance.post(`/ai/preference`, null, { params: { sessionId, preference } });

// 알러지
export const aiSetAllergy = (sessionId, allergy) =>
  instance.post(`/ai/allergy`, null, { params: { sessionId, allergy } });

// 난이도
export const aiSetDifficulty = (sessionId, difficulty) =>
  instance.post(`/ai/difficulty`, null, { params: { sessionId, difficulty } });

// 끼니: mealtime (경로 주의)
export const aiSetMealTime = (sessionId, mealTime) =>
  instance.post(`/ai/mealtime`, null, { params: { sessionId, mealTime } });

// 선호하는 맛
export const aiSetFlavor = (sessionId, flavor) =>
  instance.post(`/ai/flavor`, null, { params: { sessionId, flavor } });

// 날씨
export const aiSetWeather = (sessionId, weather) =>
  instance.post(`/ai/weather`, null, { params: { sessionId, weather } });

// 재료 -> 추천
export const aiSetIngredientsAndRecommend = (sessionId, ingredients) =>
  instance.post(`/ai/ingredients`, null, { params: { sessionId, ingredients } });

// 상세
export const aiRecipeDetailByName = (foodName) =>
  instance.get(`/ai/recipe/detail`, { params: { foodName } });



export default instance;
