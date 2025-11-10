import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getFavorites, addFavorite, removeFavorite } from "../api/api"; // ✅ 통합 호출
import "../styles/SearchResult.css";

export default function SearchResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const ingredient = params.get("ingredient");

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(ingredient || "");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [favorites, setFavorites] = useState([]);

  const RECIPE_KEY = import.meta.env.VITE_RECIPE_API_KEY;

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

  // ✅ 공공데이터 레시피 불러오기
  const fetchRecipes = async (keyword) => {
    if (!keyword) return;
    setLoading(true);
    try {
      const url = `https://openapi.foodsafetykorea.go.kr/api/${RECIPE_KEY}/COOKRCP01/json/1/30/RCP_PARTS_DTLS=${encodeURIComponent(
        keyword
      )}`;
      const response = await fetch(url);
      const json = await response.json();
      const data = json?.COOKRCP01?.row;
      setRecipes(data || []);
    } catch (error) {
      console.error("API 호출 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ URL 파라미터 기반 검색
  useEffect(() => {
    if (ingredient) fetchRecipes(ingredient);
  }, [ingredient]);

  // ✅ 검색 버튼
  const handleSearch = () => {
    if (!query.trim()) return alert("재료를 입력해주세요!");
    navigate(`/search?ingredient=${encodeURIComponent(query)}`);
    fetchRecipes(query);
  };

  // ✅ 즐겨찾기 토글
  const toggleFavorite = async (recipe) => {
    const alreadyFavorite = favorites.some(
      (f) => f.recipeId === parseInt(recipe.RCP_SEQ)
    );

    try {
      if (alreadyFavorite) {
        await removeFavorite(recipe.RCP_SEQ);
        setFavorites(favorites.filter((f) => f.recipeId !== parseInt(recipe.RCP_SEQ)));
        alert("즐겨찾기에서 삭제되었습니다!");
      } else {
        await addFavorite(recipe.RCP_SEQ);
        setFavorites([...favorites, { recipeId: parseInt(recipe.RCP_SEQ) }]);
        alert("즐겨찾기에 추가되었습니다!");
      }
    } catch (err) {
      console.error("즐겨찾기 요청 실패:", err);
      alert("서버 요청 중 오류가 발생했습니다.");
    }
  };

  const isFavorite = (recipe) =>
    favorites.some((f) => f.recipeId === parseInt(recipe.RCP_SEQ));

  return (
    <div className="search-result-page">
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
      </div>

      {/* 🔥 검색 결과 */}
      <div className="search-result">
        <h2>🔍 "{ingredient}" 관련 레시피</h2>
        {loading ? (
          <p>불러오는 중...</p>
        ) : (
          <div className="recipe-list">
            {recipes.length > 0 ? (
              recipes.map((item) => (
                <div
                  key={item.RCP_SEQ}
                  className="recipe-card"
                  onClick={() => setSelectedRecipe(item)}
                >
                  <img
                    src={
                      item.ATT_FILE_NO_MAIN && item.ATT_FILE_NO_MAIN.trim() !== ""
                        ? item.ATT_FILE_NO_MAIN
                        : "https://via.placeholder.com/200x150?text=No+Image"
                    }
                    alt={item.RCP_NM || "레시피 이미지"}
                  />
                  <h3>{item.RCP_NM || "이름 없는 레시피"}</h3>
                </div>
              ))
            ) : (
              <p>검색 결과가 없습니다 😢</p>
            )}
          </div>
        )}
      </div>

      {/* 🧾 모달 */}
      {selectedRecipe && (
        <div className="modal-overlay" onClick={() => setSelectedRecipe(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedRecipe(null)}>
              ✖
            </button>

            <img
              src={
                selectedRecipe.ATT_FILE_NO_MAIN &&
                selectedRecipe.ATT_FILE_NO_MAIN.trim() !== ""
                  ? selectedRecipe.ATT_FILE_NO_MAIN
                  : "https://via.placeholder.com/200x150?text=No+Image"
              }
              alt={selectedRecipe.RCP_NM}
            />
            <h2>{selectedRecipe.RCP_NM}</h2>
            <p>{selectedRecipe.RCP_PARTS_DTLS}</p>

            <div className="modal-buttons">
              <button
                className="detail-btn"
                onClick={() => {
                  navigate(`/recipe/${selectedRecipe.RCP_SEQ}`, {
                    state: { recipe: selectedRecipe },
                  });
                }}
              >
                🔍 상세 레시피 보기
              </button>

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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
