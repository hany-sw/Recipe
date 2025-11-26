import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { getFavorites, addFavorite, removeFavorite } from "../api/api";
import "../styles/SearchResult.css";

export default function SearchResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const ingredient = params.get("ingredient");

  const BASE_URL = "http://210.110.33.220:8183/api";

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(ingredient || "");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [ratings, setRatings] = useState({});

  // ✅ 즐겨찾기 초기 불러오기
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const res = await getFavorites();
        setFavorites(res.data || []);
      } catch (err) {
        console.error("즐겨찾기 불러오기 실패:", err);
      }
    };
    loadFavorites();
  }, []);

  // ✅ 즐겨찾기 추가/해제
  const toggleFavorite = async (recipe) => {
    const recipeId = Number(recipe.recipeId ?? recipe.userRecipeId ?? recipe.RCP_SEQ);
    if (!recipeId) return alert("즐겨찾기 불가능한 레시피입니다.");

    const alreadyFavorite = favorites.some((f) => f.recipeId === recipeId);

    try {
      if (alreadyFavorite) {
        await removeFavorite(recipeId);
        setFavorites((prev) => prev.filter((f) => f.recipeId !== recipeId));
      } else {
        await addFavorite(recipeId);
        setFavorites((prev) => [...prev, { recipeId }]);
      }
    } catch (err) {
      console.error("즐겨찾기 오류:", err);
    }
  };

  const isFavorite = (recipe) => {
    const recipeId = Number(recipe.recipeId ?? recipe.userRecipeId ?? recipe.RCP_SEQ);
    return favorites.some((f) => f.recipeId === recipeId);
  };

  // ⭐ 평점 조회
  const fetchRating = async (recipeId, recipeType) => {
    try {
      const res = await axios.get(`${BASE_URL}/rating/${recipeType}/${recipeId}`);
      setRatings((prev) => ({ ...prev, [recipeId]: res.data.averageRating || 0 }));
    } catch (err) {
      console.error("평점 조회 실패:", err);
    }
  };

  // ⭐ 평점 등록/수정
  const handleRate = async (recipe, value) => {
    const recipeId = Number(recipe.recipeId ?? recipe.userRecipeId ?? recipe.RCP_SEQ);
    const recipeType = recipe.userRecipeId ? "USER" : "PUBLIC";
    const token = localStorage.getItem("accessToken");
    if (!token) return alert("로그인이 필요합니다.");

    try {
      await axios.post(
        `${BASE_URL}/rating/rate`,
        { recipeId, recipeType, ratingScore: value, likeFlag: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("⭐ 평점 등록 성공");
    } catch (err) {
      const msg = err.response?.data;
      const errMsg =
        typeof msg === "string"
          ? msg
          : typeof msg === "object" && msg !== null
          ? JSON.stringify(msg)
          : "";

      if (errMsg.includes("이미 평점을 등록")) {
        try {
          await axios.put(
            `${BASE_URL}/rating/update`,
            { recipeId, recipeType, ratingScore: value, likeFlag: false },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log("⭐ 평점 수정 성공");
        } catch (updateErr) {
          console.error("⭐ 평점 수정 중 오류:", updateErr);
        }
      }
    }

    fetchRating(recipeId, recipeType);
  };

  // 🔍 검색
  const fetchRecipes = async (keyword) => {
    if (!keyword) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/recipes/search`, {
        params: { ingredients: keyword },
      });
      setRecipes(res.data || []);
      res.data?.forEach((r) => {
        const id = r.recipeId || r.userRecipeId;
        if (id) fetchRating(id, r.recipeId ? "PUBLIC" : "USER");
      });
    } catch (error) {
      console.error("검색 오류:", error);
      alert("검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ingredient) fetchRecipes(ingredient);
  }, [ingredient]);

  const handleSearch = () => {
    if (!query.trim()) return alert("재료를 입력해주세요!");
    navigate(`/search?ingredient=${encodeURIComponent(query)}`);
    fetchRecipes(query);
  };

  return (
    <div className="search-result-page">
      {/* 검색창 */}
      <div className="search-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="냉장고에 있는 재료를 입력하세요"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button onClick={handleSearch}>검색</button>
        </div>
      </div>

      {/* 검색 결과 */}
      <div className="search-result">
        {loading ? (
          <p>불러오는 중...</p>
        ) : (
          <div className="recipe-list">
            {recipes.length > 0 ? (
              recipes.map((r, idx) => {
                const title = r.title || r.RCP_NM || "제목 없음";
                const img =
                  r.imageUrl ||
                  r.ATT_FILE_NO_MAIN ||
                  "https://via.placeholder.com/200x150?text=No+Image";
                const id = r.recipeId || r.userRecipeId || r.RCP_SEQ;

                return (
                  <div
                    key={id || idx}
                    className="recipe-card"
                    onClick={(e) => {
                      if (e.target.closest(".rating-section")) return;
                      setSelectedRecipe(r);
                    }}
                  >
                    <img src={img} alt={title} />
                    <h3>{title}</h3>

                    {/* ⭐ 평점 */}
                    <div className="rating-section">
                      <div className="stars">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span
                            key={s}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRate(r, s);
                            }}
                            className={s <= (ratings[id] || 0) ? "star active" : "star"}
                          >
                            ★
                          </span>
                        ))}
                        <span className="rating-text">
                          ({ratings[id]?.toFixed?.(1) || 0})
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p>검색 결과가 없습니다.</p>
            )}
          </div>
        )}
      </div>

      {/* 모달 */}
      {selectedRecipe && (
        <div className="modal-overlay" onClick={() => setSelectedRecipe(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedRecipe(null)}>
              ✖
            </button>

            <img
              src={
                selectedRecipe.imageUrl ||
                selectedRecipe.ATT_FILE_NO_MAIN ||
                "https://via.placeholder.com/200x150?text=No+Image"
              }
              alt={selectedRecipe.title || selectedRecipe.RCP_NM}
            />
            <h2>{selectedRecipe.title || selectedRecipe.RCP_NM}</h2>
            <p>
              {selectedRecipe.ingredients ||
                selectedRecipe.RCP_PARTS_DTLS ||
                "재료 정보 없음"}
            </p>
            <p>
              {selectedRecipe.description ||
                selectedRecipe.RCP_WAY2 ||
                "조리 과정 정보 없음"}
            </p>

            <div className="modal-buttons">
              <button
                className="detail-btn"
                onClick={() => {
                  const title =
                    selectedRecipe.title ||
                    selectedRecipe.RCP_NM ||
                    selectedRecipe.name ||
                    selectedRecipe.baseRecipeName;
                  if (!title) return alert("레시피 제목을 찾을 수 없습니다!");
                  navigate("/recipe/details", { state: { title } });
                }}
              >
                🔍 상세보기
              </button>

              {/* 💖 즐겨찾기 버튼 */}
              <button
                className={`favorite-btn ${
                  isFavorite(selectedRecipe) ? "active" : ""
                }`}
                onClick={() => toggleFavorite(selectedRecipe)}
              >
                {isFavorite(selectedRecipe)
                  ? "💖 즐겨찾기 해제"
                  : "🤍 즐겨찾기 추가"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}