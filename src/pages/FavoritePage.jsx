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
  const removeFavorite = (RCP_SEQ) => {
    const updated = favorites.filter((f) => f.RCP_SEQ !== RCP_SEQ);
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
              key={r.RCP_SEQ}
              className="favorite-card"
              onClick={() => setSelectedRecipe(r)} // ✅ 카드 클릭 시 모달 열기
            >
              <img src={r.ATT_FILE_NO_MAIN} alt={r.RCP_NM} />
              <div className="favorite-info">
                <h3>{r.RCP_NM}</h3>
                <button
                  className="remove-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // 카드 클릭과 충돌 방지
                    removeFavorite(r.RCP_SEQ);
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
              src={selectedRecipe.ATT_FILE_NO_MAIN}
              alt={selectedRecipe.RCP_NM}
            />
            <h2>{selectedRecipe.RCP_NM}</h2>
            <p>{selectedRecipe.RCP_PARTS_DTLS}</p>

            <div className="modal-buttons">
              <button
                className="detail-btn"
                onClick={() =>
                  navigate(`/recipe/${selectedRecipe.RCP_SEQ}`, {
                    state: { recipe: selectedRecipe },
                  })
                }
              >
                🔍 상세 레시피 보기
              </button>
              <button
                className="favorite-remove-btn"
                onClick={() => {
                  removeFavorite(selectedRecipe.RCP_SEQ);
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
