// src/pages/AiResults.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import "../styles/AiResults.css";

export default function AiResults() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // --- 1) 넘어온 state 안전 파싱 ---
  // MainPage에서 넘긴 케이스 A: { results: string[] | object[], options: {...}, raw }
  // 기존/다른 케이스 B: { recommendations: { recommendations: object[] | string[] }, preferences: {...} }
  const resultsRaw = state?.results ?? state?.recommendations?.recommendations ??state?.recommendations?.items ?? [];

  // 문자열 배열이면 {title: str}로 변환, 객체면 그대로 사용
  const items = useMemo(() => {
    if (!Array.isArray(resultsRaw)) return [];
    if (resultsRaw.length === 0) return [];
    if (typeof resultsRaw[0] === "string") {
      return resultsRaw.map((t) => ({ title: t }));
    }
    return resultsRaw;
  }, [resultsRaw]);

  const prefs = state?.options || state?.preferences || {};

  const foodPreference =
    prefs.foodPreference || prefs.categories || []; // 이름 다른 경우 대비
  const allergies = prefs.allergies || [];
  const difficulty = prefs.difficulty || "-";
  const mealTime = prefs.mealTime || (Array.isArray(prefs.meals) ? prefs.meals.join(", ") : prefs.meals) || "-";
  const weather =
    prefs.weather && Array.isArray(prefs.weather)
      ? prefs.weather.join(", ")
      : prefs.weather || "-";
  const ingredients = prefs.ingredients || "-";

  return (
    <div className="ai-results-page">
      <h1>🤖 AI 추천 결과</h1>

      {/* 선택 옵션 요약 */}
      <div className="pref-box">
        <div><b>선호:</b> {Array.isArray(foodPreference) ? foodPreference.join(", ") : foodPreference || "-"}</div>
        <div><b>알러지:</b> {Array.isArray(allergies) ? allergies.join(", ") : allergies || "-"}</div>
        <div><b>난이도:</b> {difficulty}</div>
        <div><b>끼니:</b> {mealTime}</div>
        <div><b>날씨:</b> {weather}</div>
        <div><b>재료:</b> {ingredients}</div>
      </div>

      {/* 결과 리스트 */}
      <div className="result-list">
        {items.length === 0 ? (
          <div>
            <p>추천 결과가 없습니다.</p>
            {/* 디버깅이 필요하면 원본 state 확인용 */}
            {state?.raw && (
              <pre style={{ textAlign: "left", whiteSpace: "pre-wrap" }}>
                {JSON.stringify(state.raw, null, 2)}
              </pre>
            )}
          </div>
        ) : (
          items.map((it, idx) => {
            const title = it.title || it.foodName || it.name || `추천 ${idx + 1}`;
            const img = it.imageUrl || it.image || "/no-image.png";
            return (
              <div key={`${title}-${idx}`} className="result-card">
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
