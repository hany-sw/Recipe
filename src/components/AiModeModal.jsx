import { useEffect, useMemo, useState, useCallback } from "react";
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setPrefs(safeInitial);
      setAllergyInput("");
    }
  }, [open, safeInitial]);

  const setSingle = useCallback(
    (key, value) => setPrefs((p) => ({ ...p, [key]: value })),
    []
  );

  const toggleAllergy = useCallback((value) => {
    setPrefs((prev) => {
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
      prev.allergies.includes(v)
        ? prev
        : { ...prev, allergies: [...prev.allergies, v] }
    );
    setAllergyInput("");
  }, [allergyInput]);

  const chip = useCallback((active) => `chip ${active ? "active" : ""}`, []);

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
    try {
      // 1) 세션 시작 (바디 없이)
      const startRes = await aiStart();
      const sessionId = startRes.data?.sessionId;
      if (!sessionId) throw new Error("세션 ID를 받지 못했습니다.");

      // 2) 선호/시간/날씨/알러지/난이도 반영 (경로+파라미터 이름 주의)
      if (prefs.foodPreference)
        await aiSetFoodPreference(sessionId, prefs.foodPreference);

      if (prefs.mealTime)
        await aiSetMealTime(sessionId, prefs.mealTime);

      if (prefs.weather)
        await aiSetWeather(sessionId, prefs.weather);

      if (prefs.allergies.length > 0) {
        await aiSetAllergy(sessionId, prefs.allergies); // 여러 개 한방에
          }

      if (prefs.difficulty)
        await aiSetDifficulty(sessionId, prefs.difficulty);

      // 3) 재료 입력 → 추천
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
    } finally {
      setLoading(false);
    }
  }, [navigate, onClose, prefs]);

  if (!open) return <div style={{ display: "none" }} aria-hidden="true" />;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ai" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✖</button>
        <h2>🤖 AI 추천 모드</h2>

        {/* 선호 음식 (단일) */}
        <section className="ai-row">
          <h4>선호 음식</h4>
          {["한식","양식","중식","비건","동남아","그 외"].map((c) => (
            <button
              key={c}
              className={chip(prefs.foodPreference === c)}
              onClick={() => setSingle("foodPreference", c)}
            >
              {c}
            </button>
          ))}
        </section>

        {/* 알러지 (다중 + 기타) */}
        <section className="ai-row">
          <h4>알러지(다중)</h4>
          {["우유","계란","대두","밀","갑각류","견과류"].map((a) => (
            <button
              key={a}
              className={chip(prefs.allergies.includes(a))}
              onClick={() => toggleAllergy(a)}
            >
              {a}
            </button>
          ))}
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
        </section>

        {/* 난이도 */}
        <section className="ai-row">
          <h4>난이도</h4>
          {["쉬움","보통","어려움"].map((d) => (
            <button
              key={d}
              className={chip(prefs.difficulty === d)}
              onClick={() => setSingle("difficulty", d)}
            >
              {d}
            </button>
          ))}
        </section>

        {/* 끼니 */}
        <section className="ai-row">
          <h4>끼니</h4>
          {["아침","점심","저녁","그 외"].map((m) => (
            <button
              key={m}
              className={chip(prefs.mealTime === m)}
              onClick={() => setSingle("mealTime", m)}
            >
              {m}
            </button>
          ))}
        </section>

        {/* 날씨 */}
        <section className="ai-row">
          <h4>오늘의 날씨</h4>
          {["맑음","흐림","비","추움","더움"].map((w) => (
            <button
              key={w}
              className={chip(prefs.weather === w)}
              onClick={() => setSingle("weather", w)}
            >
              {w}
            </button>
          ))}
        </section>

        {/* 재료 */}
        <section className="ai-row">
          <h4>재료</h4>
          <input
            placeholder="예) 달걀, 대파, 베이컨"
            value={prefs.ingredients}
            onChange={(e) => setPrefs((p) => ({ ...p, ingredients: e.target.value }))}
          />
        </section>

        <div className="ai-actions">
          <button className="start-ai-btn" onClick={runAI} disabled={loading}>
            {loading ? "추천 중..." : "확인 → 추천 받기"}
          </button>
        </div>
      </div>
    </div>
  );
}
