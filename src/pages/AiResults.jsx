// src/pages/AiResults.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState, useCallback } from "react";
import { aiRecipeDetailByName } from "../api/api";   // ✅ 추가
import "../styles/AiResults.css";

export default function AiResults() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const resultsRaw =
    state?.results ??
    state?.recommendations?.recommendations ??
    state?.recommendations?.items ??
    [];

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

  const toText = (v) => (typeof v === "string" ? v : "");
  const pickTitle = (it) =>
    it.title || it.foodName || it.name || it.baseRecipeName || "추천 요리";
  const pickIngredients = (it) =>
    it.ingredients || it.RCP_PARTS_DTLS || it.materials || "";

  const pickReason = (it) =>
    it.reason ||
    it.recommendationReason ||
    it.reasonText ||
    (() => {
      const parts = [];
      if (foodPreference) parts.push(`${foodPreference} 취향 반영`);
      if (difficulty && difficulty !== "-") parts.push(`난이도 ${difficulty}`);
      if (Array.isArray(allergies) && allergies.length) parts.push(`알러지 제외`);
      if (mealTime && mealTime !== "-") parts.push(`${mealTime}용`);
      if (weather && weather !== "-") parts.push(`${weather} 날씨 추천`);
      return parts.length ? parts.join(" · ") : "선택 조건을 반영한 추천";
    })();

  // ✅ 펼침/접힘 + 상세 캐시
  const [openSet, setOpenSet] = useState(() => new Set());
  const [detailMap, setDetailMap] = useState({}); // { [title]: { ingredients, description, imageUrl, ... } }
  const [loadingIdx, setLoadingIdx] = useState(null);

  const fetchDetailIfNeeded = useCallback(async (title, idx) => {
    if (!title || detailMap[title]) return;
    try {
      setLoadingIdx(idx);
      const res = await aiRecipeDetailByName(title);
      const data = res?.data || {};
      setDetailMap((m) => ({ ...m, [title]: data }));
    } catch (e) {
      // 콘솔만 찍고 UI는 조용히 유지
      console.warn("상세 불러오기 실패:", e);
    } finally {
      setLoadingIdx(null);
    }
  }, [detailMap]);

  const toggleOpen = useCallback(
    async (idx) => {
      const it = items[idx];
      const title = pickTitle(it);
      const next = new Set(openSet);
      if (next.has(idx)) {
        next.delete(idx);
        setOpenSet(next);
      } else {
        next.add(idx);
        setOpenSet(next);
        // ✅ 펼칠 때 상세 비동기 로딩
        await fetchDetailIfNeeded(title, idx);
      }
    },
    [items, openSet, fetchDetailIfNeeded]
  );

  return (
    <div className="ai-results-page">
      <h1>🤖 AI 추천 결과</h1>

      <div className="pref-box">
        <div><b>선호:</b> {foodPreference || "-"}</div>
        <div><b>알러지:</b> {allergies.length ? allergies.join(", ") : "-"}</div>
        <div><b>난이도:</b> {difficulty}</div>
        <div><b>끼니:</b> {mealTime}</div>
        <div><b>날씨:</b> {weather}</div>
        <div><b>재료:</b> {ingredientsSel}</div>
      </div>

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
            const isOpen = openSet.has(idx);

            // ✅ 상세가 있으면 상세 재료 우선 사용
            const detailed = detailMap[title] || {};
            const ings =
              toText(detailed.ingredients) || toText(pickIngredients(it));

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
                    {loadingIdx === idx ? (
                      <div className="ing-text muted">재료 불러오는 중…</div>
                    ) : ings ? (
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
                        e.stopPropagation();
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
