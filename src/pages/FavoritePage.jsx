import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getFavorites, removeFavorite } from "../api/api";

import "../styles/common.css";        // ⭐ 공통 스타일 추가
import "../styles/FavoritePage.css";

export default function FavoritePage() {
  const [favorites, setFavorites] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const navigate = useNavigate();

  const BASE_URL = "http://localhost:8183/api";

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await getFavorites();
        const data = res.data || [];

        // 🔹 recipeId로 상세정보 불러와 enrich
        const enriched = await Promise.all(
          data.map(async (fav) => {
            try {
              const detail = await axios.get(`${BASE_URL}/recipes/${fav.recipeId}`);
              return { ...fav, recipe: detail.data };
            } catch {
              return fav;
            }
          })
        );

        setFavorites(enriched);
      } catch (err) {
        console.error("즐겨찾기 불러오기 실패:", err);
      }
    };

    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (recipeId) => {
    try {
      await removeFavorite(recipeId);
      setFavorites((prev) => prev.filter((f) => f.recipeId !== recipeId));
      alert("즐겨찾기에서 삭제되었습니다!");
    } catch (err) {
      console.error("삭제 실패:", err);
    }
  };

  return (
    <div className="page-container"> {/* ⭐ 공통 레이아웃 */}

      {/* ⭐ 상단 제목 통일 */}
      <h2 className="page-title">
        <span className="page-title-icon">❤️</span>
        즐겨찾기한 레시피
      </h2>

      {favorites.length === 0 ? (
        <p className="empty">즐겨찾기한 레시피가 없습니다</p>
      ) : (
        <div className="favorite-list">
          {favorites.map((f) => {
            const recipe = f.recipe || {};

            return (
              <div
                key={f.favoriteId}
                className="favorite-card"
                onClick={() => setSelectedRecipe(recipe)}
              >
                <img
                  src={recipe.imageUrl || "/no-image.png"}
                  alt={recipe.title || "레시피 이미지"}
                />

                <div className="favorite-info">
                  <h3>{recipe.title || "제목 없음"}</h3>

                  <button
                    className="remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFavorite(f.recipeId);
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 상세 모달 */}
      {selectedRecipe && (
        <div className="modal-overlay" onClick={() => setSelectedRecipe(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedRecipe(null)}>
              ✖
            </button>

            <img
              src={selectedRecipe.imageUrl || "/no-image.png"}
              alt={selectedRecipe.title}
            />
            <h2>{selectedRecipe.title}</h2>
            <p>{selectedRecipe.ingredients}</p>

            <div className="modal-buttons">
              <button
                className="detail-btn"
                onClick={() =>
                  navigate("/recipe/details", {
                    state: { recipe: selectedRecipe },
                  })
                }
              >
                🔍 상세 레시피 보기
              </button>

              <button
                className="favorite-remove-btn"
                onClick={() => {
                  handleRemoveFavorite(selectedRecipe.recipeId);
                  setSelectedRecipe(null);
                }}
              >
                ❤️ 즐겨찾기 해제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
