import { useEffect, useMemo, useState, useCallback, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  aiStart,
  aiSetFoodPreference,
  aiSetAllergy,
  aiSetDifficulty,
  aiSetMealTime,
  aiSetWeather,
  aiSetIngredientsAndRecommend,
} from "../api/api";
import "../styles/MainPage.css";

export default function AiModeModal({ open, onClose, initial }) {
  const navigate = useNavigate();

  const safeInitial = useMemo(
    () =>
      initial || {
        foodPreference: "",
        allergies: [],
        difficulty: "",
        mealTime: "",
        weather: "",
        ingredients: "",
      },
    [initial]
  );

  const [prefs, setPrefs] = useState(safeInitial);
  const [allergyInput, setAllergyInput] = useState("");
  const [step, setStep] = useState(0); // 0~5 질문, 6 로딩
  const [loading, setLoading] = useState(false);

  // ---- 자동 높이 애니메이션 ----
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState("auto");

  useEffect(() => {
    if (open) {
      setPrefs(safeInitial);
      setAllergyInput("");
      setStep(0);
      setLoading(false);
    }
  }, [open, safeInitial]);

  useLayoutEffect(() => {
    if (!open) return;
    const el = contentRef.current;
    if (!el) return;

    const apply = () => {
      const next = el.offsetHeight;
      // “답답하지 않게” 보기 좋은 최소/최대 높이로 클램프
      const clamped = Math.max(420, Math.min(next, 720));
      setContainerHeight(clamped);
    };

    apply();
    let ro;
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(apply);
      ro.observe(el);
    } else {
      const id = setInterval(apply, 200);
      return () => clearInterval(id);
    }
    return () => ro && ro.disconnect();
  }, [open, step, prefs.allergies.length, loading]);

  const chip = (active) => `chip ${active ? "active" : ""}`;
  const next = () => setStep((s) => s + 1);
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const setSingle = useCallback((key, value, autoNext = true) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    if (autoNext) next();
  }, []);

  const toggleAllergy = useCallback((value) => {
    setPrefs((prev) => {
      if (value === "없음") return { ...prev, allergies: [] };
      const arr = prev.allergies ?? [];
      return arr.includes(value)
        ? { ...prev, allergies: arr.filter((v) => v !== value) }
        : { ...prev, allergies: [...arr, value] };
    });
  }, []);

  const addCustomAllergy = useCallback(() => {
    const v = allergyInput.trim();
    if (!v) return;
    setPrefs((prev) =>
      prev.allergies.includes(v) ? prev : { ...prev, allergies: [...prev.allergies, v] }
    );
    setAllergyInput("");
  }, [allergyInput]);

  const runAI = useCallback(async () => {
    if (!prefs.ingredients.trim()) {
      alert("재료를 입력해주세요!");
      return;
    }
    if (!localStorage.getItem("accessToken")) {
      alert("로그인이 필요합니다.");
      return;
    }

    setLoading(true);
    setStep(6); // 로딩 화면

    try {
      const startRes = await aiStart();
      const sessionId = startRes.data?.sessionId;
      if (!sessionId) throw new Error("세션 ID를 받지 못했습니다.");

      if (prefs.foodPreference) await aiSetFoodPreference(sessionId, prefs.foodPreference);
      if (prefs.mealTime) await aiSetMealTime(sessionId, prefs.mealTime);
      if (prefs.weather) await aiSetWeather(sessionId, prefs.weather);
      if (prefs.difficulty) await aiSetDifficulty(sessionId, prefs.difficulty);

      if (Array.isArray(prefs.allergies) && prefs.allergies.length > 0) {
        for (const a of prefs.allergies) await aiSetAllergy(sessionId, a);
      }

      const recRes = await aiSetIngredientsAndRecommend(sessionId, prefs.ingredients);
      const payload = recRes.data || {};
      const results =
        payload.recommendations ||
        payload.items ||
        payload.titles ||
        payload.list ||
        (Array.isArray(payload) ? payload : []);

      navigate("/ai-results", {
        state: {
          results: Array.isArray(results) ? results : [],
          preferences: {
            foodPreference: prefs.foodPreference,
            allergies: prefs.allergies,
            difficulty: prefs.difficulty,
            meals: [prefs.mealTime].filter(Boolean),
            weather: [prefs.weather].filter(Boolean),
            ingredients: prefs.ingredients,
          },
          raw: payload,
        },
      });
      onClose?.();
    } catch (err) {
      console.error("AI 추천 실패:", err);
      alert(err.response?.data || err.message || "AI 추천 중 오류가 발생했습니다.");
      setStep(5); // 입력 화면으로 복귀
    } finally {
      setLoading(false);
    }
  }, [navigate, onClose, prefs]);

  if (!open) return <div style={{ display: "none" }} aria-hidden="true" />;

  // 💡 “전체 모달보다 약간 작게 + 넉넉한 여백 + 가운데 정렬”
  const containerStyle = {
    width: "min(720px, 92vw)",
    minWidth: 380,
    maxWidth: 720,
    height: typeof containerHeight === "number" ? `${containerHeight}px` : containerHeight,
    maxHeight: 720,
    transition: "height 260ms ease",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center", // 세로 가운데
    alignItems: "center",     // 가로 가운데
    padding: "24px 20px 28px", // 넉넉한 내부 여백
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ai" onClick={(e) => e.stopPropagation()} style={containerStyle} ref={containerRef}>
        <button className="close-btn" onClick={onClose}>✖</button>

        <div ref={contentRef} className="ai-content">
          {/* 제목 */}
          {step <= 5 && <h2 className="ai-title">🤖 AI 추천 모드</h2>}
          {step === 6 && <h2 className="ai-title">🤖 AI가 레시피를 찾는 중…</h2>}

          {/* 0) 선호 음식 */}
          {step === 0 && (
            <section className="ai-row ai-center">
              <h4 className="ai-question">안녕하세요! 오늘 어떤 음식을 드시고 싶으신가요?</h4>
              <div className="choice-grid">
                {["한식","양식","중식","비건","동남아","그 외"].map((c) => (
                  <button
                    key={c}
                    className={chip(prefs.foodPreference === c)}
                    onClick={() => setSingle("foodPreference", c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 1) 알러지 */}
          {step === 1 && (
            <section className="ai-row ai-center">
              <h4 className="ai-question">알러지는 있으신가요?</h4>
              <div className="choice-grid">
                {["우유","계란","대두","밀","갑각류","견과류","없음"].map((a) => (
                  <button
                    key={a}
                    className={chip(prefs.allergies.includes(a))}
                    onClick={() => toggleAllergy(a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <div className="allergy-add">
                <input
                  placeholder="기타 알러지 입력"
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                />
                <button className="mini" onClick={addCustomAllergy}>추가</button>
              </div>
              {prefs.allergies.length > 0 && (
                <div className="tagline">
                  선택됨: {prefs.allergies.map((t) => <span key={t} className="tag">{t}</span>)}
                </div>
              )}
              <div className="ai-actions row">
                <button onClick={prev}>이전</button>
                <button className="start-ai-btn" onClick={next}>다음</button>
              </div>
            </section>
          )}

          {/* 2) 난이도 */}
          {step === 2 && (
            <section className="ai-row ai-center">
              <h4 className="ai-question">요리 난이도는 어떤 걸 원하시나요?</h4>
              <div className="choice-grid">
                {["쉬움","보통","어려움","상관없음"].map((d) => (
                  <button
                    key={d}
                    className={chip(prefs.difficulty === d)}
                    onClick={() => setSingle("difficulty", d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="ai-actions row">
                <button onClick={prev}>이전</button>
                <button className="start-ai-btn" onClick={next}>다음</button>
              </div>
            </section>
          )}

          {/* 3) 끼니 */}
          {step === 3 && (
            <section className="ai-row ai-center">
              <h4 className="ai-question">식사 시간대는 언제인가요?</h4>
              <div className="choice-grid">
                {["아침","점심","저녁","간식","그 외"].map((m) => (
                  <button
                    key={m}
                    className={chip(prefs.mealTime === m)}
                    onClick={() => setSingle("mealTime", m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="ai-actions row">
                <button onClick={prev}>이전</button>
                <button className="start-ai-btn" onClick={next}>다음</button>
              </div>
            </section>
          )}

          {/* 4) 날씨 */}
          {step === 4 && (
            <section className="ai-row ai-center">
              <h4 className="ai-question">오늘 날씨는 어떤가요?</h4>
              <div className="choice-grid">
                {["맑음","흐림","비","추움","더움","그 외"].map((w) => (
                  <button
                    key={w}
                    className={chip(prefs.weather === w)}
                    onClick={() => setSingle("weather", w)}
                  >
                    {w}
                  </button>
                ))}
              </div>
              <div className="ai-actions row">
                <button onClick={prev}>이전</button>
                <button className="start-ai-btn" onClick={next}>다음</button>
              </div>
            </section>
          )}

          {/* 5) 재료 입력 */}
          {step === 5 && (
            <section className="ai-row ai-center">
              <h4 className="ai-question">가지고 있는 재료를 입력해주세요 (예: 달걀, 감자, 치킨)</h4>
              <input
                className="ai-input"
                placeholder="예) 달걀, 대파, 베이컨"
                value={prefs.ingredients}
                onChange={(e) => setPrefs((p) => ({ ...p, ingredients: e.target.value }))}
              />
              <div className="ai-actions row">
                <button onClick={prev}>이전</button>
                <button className="start-ai-btn" onClick={runAI} disabled={loading}>
                  {loading ? "추천 중..." : "확인 → 추천 받기"}
                </button>
              </div>
            </section>
          )}

          {/* 6) 로딩 */}
          {step === 6 && (
            <section className="ai-row ai-center">
              <div className="spinner" />
              <div className="ai-loading-text">AI: 감사합니다! 조건에 맞는 추천 요리를 찾고 있어요...</div>
            </section>
          )}
        </div>

        <style>{`
          .spinner {
            width: 32px; height: 32px;
            border-radius: 50%;
            border: 3px solid #e0e0e0;
            border-top-color: #7c5cff;
            animation: spin 0.9s linear infinite;
            margin-bottom: 10px;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
