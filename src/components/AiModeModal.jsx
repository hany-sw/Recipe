import { useState } from "react";
import "../styles/MainPage.css"; // 버튼/모달 스타일 재사용

export default function AiModeModal({ open, onClose, onConfirm, initial }) {
  if (!open) return null;

  const [prefs, setPrefs] = useState(
    initial || {
      cuisines: [],   // ["한식","양식"...]
      allergies: [],  // ["우유","밀"...]
      difficulty: "", // "쉬움" 등
      mealTime: "",   // "아침" 등
      weather: "",    // "맑음" 등
      ingredients: "",// "달걀, 양파"
    }
  );
  const [allergyInput, setAllergyInput] = useState("");

  const toggleMulti = (key, value) => {
    setPrefs((prev) => {
      const arr = prev[key] ?? [];
      return arr.includes(value)
        ? { ...prev, [key]: arr.filter((v) => v !== value) }
        : { ...prev, [key]: [...arr, value] };
    });
  };
  const setSingle = (key, value) => setPrefs((p) => ({ ...p, [key]: value }));

  const addCustomAllergy = () => {
    const v = allergyInput.trim();
    if (!v) return;
    setPrefs((prev) =>
      prev.allergies.includes(v)
        ? prev
        : { ...prev, allergies: [...prev.allergies, v] }
    );
    setAllergyInput("");
  };

  const chip = (active) => `chip ${active ? "active" : ""}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ai" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✖</button>
        <h2>🤖 AI 추천 모드</h2>

        {/* 1) 선호 음식(다중) */}
        <section className="ai-row">
          <h4>선호 음식(다중)</h4>
          {["한식","양식","중식","비건","동남아","그 외"].map((c) => (
            <button
              key={c}
              className={chip(prefs.cuisines.includes(c))}
              onClick={() => toggleMulti("cuisines", c)}
            >
              {c}
            </button>
          ))}
        </section>

        {/* 2) 알러지(다중 + 기타) */}
        <section className="ai-row">
          <h4>알러지(다중)</h4>
          {["우유","계란","대두","밀","갑각류","견과류"].map((a) => (
            <button
              key={a}
              className={chip(prefs.allergies.includes(a))}
              onClick={() => toggleMulti("allergies", a)}
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

        {/* 3) 난이도 */}
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

        {/* 4) 끼니 */}
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

        {/* 5) 날씨 */}
        <section className="ai-row">
          <h4>오늘의 날씨</h4>
          {["맑음","흐림","비","추움"].map((w) => (
            <button
              key={w}
              className={chip(prefs.weather === w)}
              onClick={() => setSingle("weather", w)}
            >
              {w}
            </button>
          ))}
        </section>

        {/* 6) 재료 */}
        <section className="ai-row">
          <h4>재료</h4>
          <input
            placeholder="예) 달걀, 대파, 베이컨"
            value={prefs.ingredients}
            onChange={(e) => setPrefs((p) => ({ ...p, ingredients: e.target.value }))}
          />
        </section>

        <div className="ai-actions">
          <button className="start-ai-btn" onClick={() => onConfirm(prefs)}>
            확인 → 추천 받기
          </button>
        </div>
      </div>
    </div>
  );
}
