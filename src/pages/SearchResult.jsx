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
  const [isAIMode, setIsAIMode] = useState(() => {
    const saved = localStorage.getItem("isAIMode");
    return saved === "true";
  });

  // ⭐ 추가된 부분: 평점 상태 저장
  const [ratings, setRatings] = useState({});

  // ✅ 초기 즐겨찾기 불러오기
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

  // ⭐ 평점 불러오기
  const fetchRating = async (recipeId, recipeType) => {
    try {
      const res = await axios.get(`${BASE_URL}/rating/${recipeType}/${recipeId}`);
      setRatings((prev) => ({
        ...prev,
        [recipeId]: res.data.averageRating || 0,
      }));
    } catch (err) {
      console.error("평점 조회 실패:", err);
    }
  };

  // ⭐ 평점 등록
  const handleRate = async (recipe, value) => {
    const recipeId = recipe.recipeId || recipe.userRecipeId || recipe.RCP_SEQ;
    const recipeType = recipe.recipeId ? "PUBLIC" : "USER";

    try {
      await axios.post(
        `${BASE_URL}/rating/rate`,
        {
          recipeId,
          recipeType,
          ratingScore: value,
          likeFlag: false,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      fetchRating(recipeId, recipeType); // 등록 후 평균 새로 불러오기
    } catch (err) {
      console.error("평점 등록 실패:", err);
    }
  };

  // ✅ 검색
  const fetchRecipes = async (keyword) => {
    if (!keyword) return;
    setLoading(true);

    try {
      let res;
      if (isAIMode) {
        res = await axios.get(`${BASE_URL}/recipes/recommend/ai`, {
          params: { ingredients: keyword },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        const aiResults = res.data?.recommendations || [];
        if (aiResults.length === 0) {
          setRecipes([]);
          setLoading(false);
          return;
        }

        const detailPromises = aiResults.map(async (foodName) => {
          // console.log("🔍 요청되는 foodName:", foodName);
          try {
            const detail = await axios.get(
              `${BASE_URL}/recipes/recommend/ai/detail`,
              {
                params: { foodName },
                headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
              }
            );
            const data = detail.data;
            if (!data || !data.title)
              return { title: foodName, imageUrl: "", ingredients: "", description: "" };
            return data;
          } catch (e) {
            console.error("AI 상세 요청 실패:", e);
            return { title: foodName, imageUrl: "", ingredients: "", description: "" };
          }
        });

        const details = await Promise.all(detailPromises);
        setRecipes(details);
        const validDetails = details.filter((r) => r !== null);
        setRecipes(validDetails);

        // ⭐ 평점 미리 불러오기
        validDetails.forEach((r) => {
          const id = r.recipeId || r.userRecipeId;
          if (id) fetchRating(id, r.recipeId ? "PUBLIC" : "USER");
        });
      } else {
        res = await axios.get(`${BASE_URL}/recipes/search`, {
          params: { ingredients: keyword },
        });
        setRecipes(res.data || []);

        // ⭐ 평점 미리 불러오기
        res.data?.forEach((r) => {
          const id = r.recipeId || r.userRecipeId;
          if (id) fetchRating(id, r.recipeId ? "PUBLIC" : "USER");
        });
      }
    } catch (error) {
      console.error("검색 오류:", error);
      alert("검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ingredient) fetchRecipes(ingredient);
  }, [ingredient, isAIMode]);

  const handleSearch = () => {
    if (!query.trim()) return alert("재료를 입력해주세요!");
    navigate(`/search?ingredient=${encodeURIComponent(query)}`);
    fetchRecipes(query);
  };

  const toggleFavorite = async (recipe) => {
    const recipeId = recipe.recipeId || recipe.userRecipeId || recipe.RCP_SEQ || null;
    if (!recipeId) return alert("즐겨찾기 불가능한 레시피입니다.");

    const alreadyFavorite = favorites.some((f) => f.recipeId === parseInt(recipeId));

    try {
      if (alreadyFavorite) {
        await removeFavorite(recipeId);
        setFavorites(favorites.filter((f) => f.recipeId !== parseInt(recipeId)));
      } else {
        await addFavorite(recipeId);
        setFavorites([...favorites, { recipeId: parseInt(recipeId) }]);
      }
    } catch (err) {
      console.error("즐겨찾기 오류:", err);
    }
  };

  const isFavorite = (recipe) => {
    const recipeId = recipe.recipeId || recipe.userRecipeId || recipe.RCP_SEQ || null;
    return favorites.some((f) => f.recipeId === parseInt(recipeId));
  };

  // ✅ 상세 정보 불러오기 (모달 클릭 시 즉시 API 요청)
  const fetchRecipeDetail = async (recipeId) => {
    console.log("📡 상세조회 요청 ID:", recipeId);
    try {
      const res = await axios.get(`${BASE_URL}/recipes/${recipeId}`);
      console.log("📦 상세조회 응답:", res.data);
      setSelectedRecipe(res.data);
    } catch (err) {
      console.error("상세 레시피 불러오기 실패:", err);
      alert("레시피 정보를 불러올 수 없습니다.");
    }
  };

  return (
    <div className="search-result-page">
      {/* 검색바 */}
      <div className="search-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="냉장고에 있는 재료를 입력하세요"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key.toLowerCase() === "enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
          />
          <button onClick={handleSearch}>검색</button>
        </div>

        <div className="ai-toggle">
          <label>
            <input
              type="checkbox"
              checked={isAIMode}
              onChange={() => {
                const newMode = !isAIMode;
                setIsAIMode(newMode);
                localStorage.setItem("isAIMode", newMode); // ✅ 상태 저장
              }}
            />
            🤖 AI 모드
          </label>
        </div>
      </div>

      {/* 결과 */}
      <div className="search-result">
        <h2>
          {isAIMode ? `🤖 AI 추천 결과 (${query})` : `🔍 "${ingredient}" 관련 레시피`}
        </h2>
        {loading ? (
          <p>불러오는 중...</p>
        ) : (
          <div className="recipe-list">
            {recipes.length > 0 ? (
              recipes.map((item, idx) => {
                const title =
                  typeof item === "string"
                    ? item
                    : item.title || item.RCP_NM || item.name || "제목 없음";

                const image =
                  item.imageUrl && item.imageUrl.trim() !== ""
                    ? item.imageUrl
                    : item.ATT_FILE_NO_MAIN ||
                      "https://via.placeholder.com/200x150?text=No+Image";

                const recipeId = item.recipeId || item.userRecipeId || item.RCP_SEQ;

                return (
                  <div
                    key={recipeId || item.RCP_SEQ || item.title || idx}
                    className="recipe-card"
                    onClick={() => setSelectedRecipe(item)}
                  >
                    <img src={image} alt={title} />
                    <h3>{title}</h3>

                    {/* ⭐ 평점 표시 */}
                    <div className="rating" onClick={(e) => e.stopPropagation()}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          onClick={() => handleRate(item, star)}
                          className={
                            star <= (ratings[recipeId] || 0) ? "star active" : "star"
                          }
                        >
                          ★
                        </span>
                      ))}
                      <span className="rating-text">
                        ({ratings[recipeId]?.toFixed?.(1) || 0})
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p>검색 결과가 없습니다 </p>
            )}
          </div>
        )}
      </div>

      {/* 상세 모달 */}
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

            <div className="modal-buttons">
              <button
                className={`favorite-btn ${
                  isFavorite(selectedRecipe) ? "active" : ""
                }`}
                onClick={() => toggleFavorite(selectedRecipe)}
              >
                {isFavorite(selectedRecipe)
                  ? "❤️ 즐겨찾기 해제"
                  : "🤍 즐겨찾기 추가"}
              </button>
              <button
                className="detail-btn"
                onClick={() => {
                  // 1️⃣ 사용자 레시피
                  if (selectedRecipe.userRecipeId) {
                    navigate("/recipe/details", {
                      state: { userRecipes: [selectedRecipe] },
                    });
                    return;
                  }

                  // 2️⃣ AI 레시피 (recipeId = null)
                  if (
                    selectedRecipe.recipeId === null ||
                    selectedRecipe.createdBy === "AI"
                  ) {
                    navigate("/recipe/details", {
                      state: { aiRecipe: selectedRecipe },
                    });
                    return;
                  }

                  // 3️⃣ 공공데이터 레시피
                  const title =
                    selectedRecipe.title ||
                    selectedRecipe.RCP_NM ||
                    selectedRecipe.name ||
                    selectedRecipe.baseRecipeName;

                  if (!title) {
                    alert("레시피 제목을 찾을 수 없습니다!");
                    return;
                  }

                  navigate("/recipe/details", { state: { title } });
                }}
              >
                🔍 상세 레시피 보기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
