import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState, useCallback } from "react";
import "../styles/AiResults.css";

export default function AiResults() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // --- 원본 결과 안전 파싱 ---
  const resultsRaw =
    state?.results ??
    state?.recommendations?.recommendations ??
    state?.recommendations?.items ??
    [];

  // 문자열 배열 → {title}로 변환, 객체는 그대로
  const items = useMemo(() => {
    if (!Array.isArray(resultsRaw)) return [];
    if (resultsRaw.length === 0) return [];
    if (typeof resultsRaw[0] === "string") {
      return resultsRaw.map((t) => ({ title: t }));
    }
    return resultsRaw;
  }, [resultsRaw]);

  // 사용자 선택 옵션(상단 요약용)
  const prefs = state?.options || state?.preferences || {};
  const foodPreference =
    (typeof prefs.foodPreference === "string" && prefs.foodPreference.trim()) ||
    (Array.isArray(prefs.categories) ? prefs.categories[0] : "") ||
    "";
  const allergies = Array.isArray(prefs.allergies)
    ? prefs.allergies
    : prefs.allergies
    ? [prefs.allergies]
    : [];
  const difficulty = prefs.difficulty || "-";
  const mealTime =
    prefs.mealTime ||
    (Array.isArray(prefs.meals) ? prefs.meals.join(", ") : prefs.meals) ||
    "-";
  const weather = Array.isArray(prefs.weather)
    ? prefs.weather.join(", ")
    : prefs.weather || "-";
  const ingredientsSel = prefs.ingredients || "-";

  // 텍스트 합치기 도우미
  const toText = (v) => (typeof v === "string" ? v : "");
  const pickTitle = (it) =>
    it.title || it.foodName || it.name || it.baseRecipeName || "추천 요리";
  const pickIngredients = (it) =>
    it.ingredients || it.RCP_PARTS_DTLS || it.materials || "";
  const pickReason = (it) =>
    // 백엔드가 이유를 제공하면 최우선 사용
    it.reason ||
    it.recommendationReason ||
    it.reasonText ||
    // 없으면 간단한 규칙으로 생성
    (() => {
      const parts = [];
      if (foodPreference) parts.push(`${foodPreference} 취향 반영`);
      if (difficulty && difficulty !== "-") parts.push(`난이도 ${difficulty}`);
      if (Array.isArray(allergies) && allergies.length) parts.push(`알러지 제외`);
      if (mealTime && mealTime !== "-") parts.push(`${mealTime}용`);
      if (weather && weather !== "-") parts.push(`${weather} 날씨 추천`);
      return parts.length ? parts.join(" · ") : "선택 조건을 반영한 추천";
    })();

  // 펼침/접힘 제어 (여러 카드 동시 펼침 가능)
  const [openSet, setOpenSet] = useState(() => new Set());
  const toggleOpen = useCallback((idx) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }, []);

  return (
    <div className="ai-results-page">
      <h1>🤖 AI 추천 결과</h1>

      {/* 선택 옵션 요약 */}
      <div className="pref-box">
        <div><b>선호:</b> {foodPreference || "-"}</div>
        <div><b>알러지:</b> {allergies.length ? allergies.join(", ") : "-"}</div>
        <div><b>난이도:</b> {difficulty}</div>
        <div><b>끼니:</b> {mealTime}</div>
        <div><b>날씨:</b> {weather}</div>
        <div><b>재료:</b> {ingredientsSel}</div>
      </div>

      {/* 결과 리스트 (사진/초기 상세보기 버튼 제거) */}
      <div className="ai-compact-list">
        {items.length === 0 ? (
          <div>
            <p>추천 결과가 없습니다.</p>
            {state?.raw && (
              <pre style={{ textAlign: "left", whiteSpace: "pre-wrap" }}>
                {JSON.stringify(state.raw, null, 2)}
              </pre>
            )}
          </div>
        ) : (
          items.map((it, idx) => {
            const title = pickTitle(it);
            const reason = toText(pickReason(it));
            const ings = toText(pickIngredients(it));
            const isOpen = openSet.has(idx);

            return (
              <div
                key={`${title}-${idx}`}
                className={`ai-compact-card ${isOpen ? "open" : ""}`}
                onClick={() => toggleOpen(idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" ? toggleOpen(idx) : null)}
              >
                <div className="row-top">
                  <h3 className="title">{title}</h3>
                  <span className="chev">{isOpen ? "▲" : "▼"}</span>
                </div>

                <p className="reason">{reason}</p>

                {isOpen && (
                  <div className="expand">
                    {ings ? (
                      <>
                        <div className="ing-label">들어가는 재료</div>
                        <div className="ing-text">{ings}</div>
                      </>
                    ) : (
                      <div className="ing-text muted">재료 정보 없음</div>
                    )}

                    <button
                      className="detail"
                      onClick={(e) => {
                        e.stopPropagation(); // 카드 토글 방지
                        navigate("/recipe/details", {
                          state: { title, aiMode: true },
                        });
                      }}
                    >
                      상세보기
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
