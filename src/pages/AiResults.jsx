// src/pages/AiResults.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState, useCallback } from "react";
import { aiRecipeDetailByName } from "../api/api";
import "../styles/AiResults.css";

export default function AiResults() {
  const { state } = useLocation();
  const navigate = useNavigate();

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

    if (typeof resultsRaw[0] === "string") {
      return resultsRaw.map((t) => ({ title: t }));
    }
    return resultsRaw;
  }, [resultsRaw]);

  /* ============================================================
      2) 선택한 옵션 값 정리
  ============================================================ */
  const prefs = state?.options || state?.preferences || {};

  const foodPreference = prefs.foodPreference || "-";
  const allergies = prefs.allergies || [];
  const difficulty = prefs.difficulty || "-";
  const mealTime = prefs.mealTime || "-";
  const flavor = prefs.flavor || "-"; // ⭐ 추가
  const weather = prefs.weather || "-";
  const ingredientsSel = prefs.ingredients || "-";

  const toText = (v) => (typeof v === "string" ? v : "");

  const pickTitle = (it) =>
    it.title || it.foodName || it.name || it.baseRecipeName || "추천 요리";

  const pickIngredients = (it) =>
    it.ingredients || it.RCP_PARTS_DTLS || it.materials || "";

  /* ============================================================
      3) ✨ 설명(description) 1줄만 요약 함수
  ============================================================ */
  const shortenDescription = (text) => {
    if (!text || typeof text !== "string") return "";
    let first = text.split(/[.!?]/)[0]; // 첫 문장만
    if (first.length > 60) first = first.slice(0, 60) + "…";
    return first.trim();
  };

  /* ============================================================
      4) ✨ 재료: 단위/숫자 제거 & 핵심 재료만 남기기
  ============================================================ */
  const cleanIngredients = (ings) => {
    if (!ings) return "";

    // Case 1: List<Ingredient>
    if (Array.isArray(ings)) {
      const cleaned = ings
        .map((i) => i.name?.split("(")[0].trim()) // 이름만 + 괄호 제거
        .filter(Boolean);
      return [...new Set(cleaned)].join(", ");
    }

    // Case 2: 문자열 ("애호박 200g, 양파 1/2개 …")
    const parts = ings.split(/[,·\n;]+/);

    const cleaned = parts
      .map((p) =>
        p
          .replace(/\(.*?\)/g, "") // 괄호 제거
          .replace(/[0-9]/g, "") // 숫자 제거
          .replace(
            /(큰술|작은술|스푼|컵|개|g|kg|mg|ml|L|종지|T|t)/gi,
            ""
          ) // 단위 제거
          .trim()
      )
      .filter(Boolean);

    return [...new Set(cleaned)].join(", ");
  };

  /* ============================================================
      5) 이유 생성 (fallback)
  ============================================================ */
  const pickReason = (it) => {
    const parts = [];
    if (foodPreference !== "-") parts.push(`${foodPreference} 취향`);
    if (flavor !== "-") parts.push(`${flavor} 맛 선호`);
    if (difficulty !== "-") parts.push(`난이도 ${difficulty}`);
    if (allergies?.length) parts.push("알러지 제외");
    if (mealTime !== "-") parts.push(`${mealTime}용`);
    if (weather !== "-") parts.push(`${weather} 날씨`);

    return parts.length ? parts.join(" · ") : "전체 조건 반영";
  };

  /* ============================================================
      6) 펼침/접힘 + 상세 캐싱
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
        const data = res?.data || {};
        setDetailMap((m) => ({ ...m, [title]: data }));
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
      const title = pickTitle(it);
      const next = new Set(openSet);

      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
        await fetchDetailIfNeeded(title, idx);
      }

      setOpenSet(next);
    },
    [items, openSet, fetchDetailIfNeeded]
  );

  /* ============================================================
      7) 렌더링
  ============================================================ */
  return (
    <div className="ai-results-page">
      <h1>🤖 AI 추천 결과</h1>

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
            const title = pickTitle(it);
            const basicReason = pickReason(it);
            const isOpen = openSet.has(idx);
            const detailed = detailMap[title] || {};

            // ⭐ 설명: (상세 → 원본 → 이유) 단 첫 문장만
            const desc =
              shortenDescription(detailed.description) ||
              shortenDescription(it.description) ||
              basicReason;

            // ⭐ 재료 (단위 제거 & 핵심 재료만)
            const ings =
              cleanIngredients(detailed.ingredients) ||
              cleanIngredients(it.ingredients) ||
              cleanIngredients(pickIngredients(it));

            return (
              <div
                key={`${title}-${idx}`}
                className={`ai-compact-card ${isOpen ? "open" : ""}`}
                onClick={() => toggleOpen(idx)}
              >
                <div className="row-top">
                  <h3 className="title">{title}</h3>
                  <span className="chev">{isOpen ? "▲" : "▼"}</span>
                </div>

                <p className="reason">{desc}</p>

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
