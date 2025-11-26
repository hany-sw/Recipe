// src/pages/AiResults.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState, useCallback } from "react";
import { aiRecipeDetailByName } from "../api/api";
import "../styles/AiResults.css";

export default function AiResults() {
  const { state } = useLocation();
  const navigate = useNavigate();

  /* ============================================================
      0) GPT가 이상한 형태로 보내도 정상화하는 함수
  ============================================================ */
  const normalizeItem = (raw) => {
    if (!raw) return { title: "추천 요리", reason: "" };

    // case: string "{name: 두부카레 sentence: 매콤한 …}"
    if (typeof raw === "string") {
      const clean = raw.replace(/[\{\}]/g, "").trim();

      const nameMatch = clean.match(/name:\s*([^,}]+)/);
      const sentMatch = clean.match(/sentence:\s*(.+)/);

      return {
        title: nameMatch ? nameMatch[1].trim() : clean.split(" ")[0] || clean,
        reason: sentMatch ? sentMatch[1].trim() : "",
      };
    }

    // case: recommend: {name, sentence}
    return {
      title:
        raw.name ||
        raw.title ||
        raw.foodName ||
        raw.baseRecipeName ||
        "추천 요리",
      reason: raw.sentence || raw.description || "",
    };
  };

  /* ============================================================
      1) 추천 결과 리스트 정리
  ============================================================ */
  const resultsRaw =
    state?.results ??
    state?.recommendations?.recommendations ??
    state?.recommendations?.items ??
    [];

  const items = useMemo(() => {
    if (!Array.isArray(resultsRaw)) return [];
    if (resultsRaw.length === 0) return [];

    return resultsRaw.map((it) => normalizeItem(it));
  }, [resultsRaw]);

  /* ============================================================
      2) 선택 옵션 읽기
  ============================================================ */
  const prefs = state?.options || state?.preferences || {};

  const foodPreference = prefs.foodPreference || "-";
  const allergies = prefs.allergies || [];
  const difficulty = prefs.difficulty || "-";
  const mealTime = prefs.mealTime || "-";
  const flavor = prefs.flavor || "-";
  const weather = prefs.weather || "-";
  const ingredientsSel = prefs.ingredients || "-";

  const pickReasonFallback = () => {
    const parts = [];
    if (foodPreference !== "-") parts.push(`${foodPreference} 취향`);
    if (flavor !== "-") parts.push(`${flavor} 맛 선호`);
    if (difficulty !== "-") parts.push(`난이도 ${difficulty}`);
    if (allergies?.length) parts.push("알러지 제외");
    if (mealTime !== "-") parts.push(`${mealTime}용`);
    if (weather !== "-") parts.push(`${weather} 날씨`);
    return parts.join(" · ");
  };

  /* ============================================================
      3) 펼침/닫힘 + 상세 캐싱
  ============================================================ */
  const [openSet, setOpenSet] = useState(() => new Set());
  const [detailMap, setDetailMap] = useState({});
  const [loadingIdx, setLoadingIdx] = useState(null);

  const fetchDetailIfNeeded = useCallback(
    async (title, idx) => {
      if (!title || detailMap[title]) return;
      try {
        setLoadingIdx(idx);
        const res = await aiRecipeDetailByName(title);
        setDetailMap((m) => ({ ...m, [title]: res?.data || {} }));
      } catch (e) {
        console.warn("AI 상세 불러오기 실패:", e);
      } finally {
        setLoadingIdx(null);
      }
    },
    [detailMap]
  );

  const toggleOpen = useCallback(
    async (idx) => {
      const it = items[idx];
      const next = new Set(openSet);

      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
        await fetchDetailIfNeeded(it.title, idx);
      }
      setOpenSet(next);
    },
    [items, openSet, fetchDetailIfNeeded]
  );

  /* ============================================================
      4) 렌더링
  ============================================================ */
  return (
    <div className="ai-results-page">
      <div className="ai-title">
        <span className="ai-title-icon">🤖</span>
        AI 추천 결과
      </div>

      {/* 조건 박스 */}
      <div className="pref-box">
        <div>
          <b>음식:</b> {foodPreference}
        </div>
        <div>
          <b>맛:</b> {flavor}
        </div>
        <div>
          <b>알러지:</b> {allergies.length ? allergies.join(", ") : "-"}
        </div>
        <div>
          <b>난이도:</b> {difficulty}
        </div>
        <div>
          <b>끼니:</b> {mealTime}
        </div>
        <div>
          <b>날씨:</b> {weather}
        </div>
        <div>
          <b>재료:</b> {ingredientsSel}
        </div>
      </div>

      {/* 추천 리스트 */}
      <div className="ai-compact-list">
        {items.length === 0 ? (
          <p>추천 결과가 없습니다.</p>
        ) : (
          items.map((it, idx) => {
            const isOpen = openSet.has(idx);
            const detailed = detailMap[it.title] || {};

            const reason =
              it.reason ||
              detailed.reason ||
              pickReasonFallback();

            const ings = Array.isArray(detailed.ingredients)
              ? detailed.ingredients.map((i) => i.name).join(", ")
              : "";

            return (
              <div
                key={`${it.title}-${idx}`}
                className={`ai-compact-card ${isOpen ? "open" : ""}`}
                onClick={() => toggleOpen(idx)}
              >
                <div className="row-top">
                  <h3 className="title">{it.title}</h3>
                  <span className="chev">{isOpen ? "▲" : "▼"}</span>
                </div>

                {/* 추천 이유 */}
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
                          state: { title: it.title, aiMode: true },
                        });
                      }}
                    >
                      상세보기 →
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
