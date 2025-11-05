import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/FavoritePage.css";

export default function FavoritePage() {
  const [favorites, setFavorites] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const navigate = useNavigate();

  // ✅ localStorage 불러오기
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("favorites")) || [];
    setFavorites(stored);
  }, []);

  // ✅ 즐겨찾기 삭제
  const removeFavorite = (id) => {
    const updated = favorites.filter((f) => f.id !== id);
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  return (
    <div className="favorite-page">
      <h1>⭐ 즐겨찾기한 레시피</h1>

      {favorites.length === 0 ? (
        <p className="empty">즐겨찾기한 레시피가 없습니다 </p>
      ) : (
        <div className="favorite-list">
          {favorites.map((r) => (
            <div
              key={r.id}
              className="favorite-card"
              onClick={() => setSelectedRecipe(r)}
            >
              <img
                src={r.image || "/no-image.png"} // ✅ 안전 처리
                alt={r.title || "레시피 이미지"}
              />
              <div className="favorite-info">
                <h3>{r.title || "제목 없음"}</h3>
                <p className="author">👩‍🍳 {r.author}</p>
                <button
                  className="remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite(r.id);
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🧾 모달 (즐겨찾기 상세 보기) */}
      {selectedRecipe && (
        <div className="modal-overlay" onClick={() => setSelectedRecipe(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedRecipe(null)}>
              ✖
            </button>

            <img
              src={selectedRecipe.image || "/no-image.png"}
              alt={selectedRecipe.title}
            />
            <h2>{selectedRecipe.title}</h2>
            <p>{selectedRecipe.ingredients}</p>

            <div className="modal-buttons">
              <button
                className="detail-btn"
                onClick={() =>
                  navigate(`/recipe/${selectedRecipe.id}`, {
                    state: { recipe: selectedRecipe },
                  })
                }
              >
                🔍 상세 레시피 보기
              </button>
              <button
                className="favorite-remove-btn"
                onClick={() => {
                  removeFavorite(selectedRecipe.id);
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
