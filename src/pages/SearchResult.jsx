import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
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

  // ✅ localStorage에서 즐겨찾기 불러오기
  useEffect(() => {
    const storedFavorites = JSON.parse(localStorage.getItem("favorites")) || [];
    setFavorites(storedFavorites);
  }, []);

  // ✅ 즐겨찾기 업데이트 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // ✅ 내가 등록한 레시피 불러오기 (localStorage)
  const fetchUserRecipes = (keyword) => {
    const stored = JSON.parse(localStorage.getItem("customRecipes")) || [];
    if (!keyword) return stored;
    // 재료나 제목에 검색어가 포함된 레시피만
    return stored.filter(
      (r) =>
        r.title.toLowerCase().includes(keyword.toLowerCase()) ||
        r.ingredients.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  // ✅ 공공데이터 API + 사용자 등록 레시피 통합 불러오기
  const fetchRecipes = async (keyword) => {
    if (!keyword) return;
    setLoading(true);

    try {
      // ✅ 사용자 등록 레시피 먼저 불러오기
      const userRecipes = fetchUserRecipes(keyword);

      // ✅ 공공데이터 API 호출
      const url = `https://openapi.foodsafetykorea.go.kr/api/${RECIPE_KEY}/COOKRCP01/json/1/50/RCP_PARTS_DTLS=${encodeURIComponent(
        keyword
      )}`;
      const response = await axios.get(url);
      const data = response.data?.COOKRCP01?.row || [];

      // ✅ 통합 결과 (내 레시피 + API 레시피)
      // localStorage에서 불러온 레시피는 식별 위해 id 사용, API는 RCP_SEQ 사용
      const merged = [
        ...userRecipes.map((r) => ({
          id: r.id,
          title: r.title,
          image: r.image,
          ingredients: r.ingredients,
          steps: r.steps,
          author: r.author,
          type: "local",
        })),
        ...data.map((d) => ({
          id: d.RCP_SEQ,
          title: d.RCP_NM,
          image: d.ATT_FILE_NO_MAIN,
          ingredients: d.RCP_PARTS_DTLS,
          steps: "",
          author: "공공데이터",
          type: "api",
        })),
      ];

      setRecipes(merged);
    } catch (error) {
      console.error("API 호출 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 페이지 로드시 URL 파라미터 기반 검색
  useEffect(() => {
    if (ingredient) fetchRecipes(ingredient);
  }, [ingredient]);

  // ✅ 검색 버튼 클릭 or 엔터 입력
  const handleSearch = () => {
    if (!query.trim()) return alert("재료를 입력해주세요!");
    navigate(`/search?ingredient=${encodeURIComponent(query)}`);
    fetchRecipes(query);
  };

  // ✅ 즐겨찾기 토글 (localStorage 반영)
  const toggleFavorite = (recipe) => {
    const alreadyFavorite = favorites.some((f) => f.id === recipe.id);
    let updatedFavorites;
    if (alreadyFavorite) {
      updatedFavorites = favorites.filter((f) => f.id !== recipe.id);
    } else {
      updatedFavorites = [...favorites, recipe];
    }
    setFavorites(updatedFavorites);
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
  };

  const isFavorite = (recipe) =>
    favorites.some((f) => f.id === recipe.id);

  return (
    <div className="search-result-page">
      {/* 🔍 상단 검색바 */}
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
                  key={item.id}
                  className="recipe-card"
                  onClick={() => setSelectedRecipe(item)}
                >
                  <img src={item.image} alt={item.title} />
                  <h3>{item.title}</h3>
                  <p className="recipe-author">
                    👩‍🍳 {item.author || "알 수 없음"}
                  </p>
                </div>
              ))
            ) : (
              <p>검색 결과가 없습니다 😢</p>
            )}
          </div>
        )}
      </div>

      {/* 🧾 모달 (레시피 상세) */}
      {selectedRecipe && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedRecipe(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-btn"
              onClick={() => setSelectedRecipe(null)}
            >
              ✖
            </button>

            <img
              src={selectedRecipe.image}
              alt={selectedRecipe.title}
            />
            <h2>{selectedRecipe.title}</h2>
            <p>{selectedRecipe.ingredients}</p>

            <div className="modal-buttons">
              <button
                className="detail-btn"
                onClick={() => {
                  navigate(`/recipe/${selectedRecipe.id}`, {
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
