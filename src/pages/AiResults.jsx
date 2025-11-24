// src/pages/AiResults.jsx
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/AiResults.css";

export default function AiResults() {
  const location = useLocation();
  const navigate = useNavigate();

  const data = location.state || {};
  const { recommendations, preferences } = data;

  const items =
    recommendations?.recommendations ||
    recommendations?.items ||
    []; // 백엔드 구조에 맞춰 key 조정

  return (
    <div className="ai-results-page">
      <h1>🤖 AI 추천 결과</h1>

      {preferences && (
        <div className="pref-box">
          <div><b>선호:</b> {preferences.categories?.join(", ") || "-"}</div>
          <div><b>알러지:</b> {preferences.allergies?.join(", ") || "-"}</div>
          <div><b>난이도:</b> {preferences.difficulty || "-"}</div>
          <div><b>식사시간:</b> {preferences.meals?.join(", ") || "-"}</div>
          <div><b>날씨:</b> {preferences.weather?.join(", ") || "-"}</div>
          <div><b>재료:</b> {preferences.ingredients || "-"}</div>
        </div>
      )}

      <div className="result-list">
        {items.length === 0 ? (
          <p>추천 결과가 없습니다.</p>
        ) : (
          items.map((it, idx) => {
            const title =
              it.title || it.foodName || it.name || `추천 ${idx + 1}`;
            const img = it.imageUrl || it.image || "/no-image.png";
            return (
              <div key={idx} className="result-card">
                <img src={img} alt={title} />
                <h3>{title}</h3>
                <button
                  className="detail"
                  onClick={() =>
                    navigate("/recipe/details", { state: { title } })
                  }
                >
                  상세보기
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
