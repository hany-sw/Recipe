// src/pages/AiResults.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import "../styles/AiResults.css";

export default function AiResults() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // 넘어온 결과 구조: A) { results, options/raw }  B) { recommendations: { recommendations | items }, preferences }
  const resultsRaw =
    (state && state.results) ||
    (state && state.recommendations && (state.recommendations.recommendations || state.recommendations.items)) ||
    [];

  // 문자열 배열이면 객체로 변환
  const baseItems = useMemo(() => {
    if (!Array.isArray(resultsRaw)) return [];
    if (resultsRaw.length === 0) return [];
    if (typeof resultsRaw[0] === "string") {
      return resultsRaw.map((t) => ({ title: t }));
    }
    return resultsRaw;
  }, [resultsRaw]);

  // 선택 옵션
  const prefs = (state && (state.options || state.preferences)) || {};
  const foodPreference = (() => {
    if (typeof prefs.foodPreference === "string" && prefs.foodPreference.trim()) {
      return prefs.foodPreference.trim();
    }
    if (Array.isArray(prefs.categories) && prefs.categories[0]) {
      return String(prefs.categories[0]);
    }
    return "";
  })();

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

  // 필터/재랭킹 키워드
  const FOOD_PREF_KEYWORDS = {
    "한식": ["김치","된장","고추장","비빔","불고기","나물","전","찌개","국","잡채","갈비","비빔밥","떡볶이","김밥"],
    "중식": ["짬뽕","짜장","멘보샤","마파두부","훠궈","우육면","깐풍","탕수육","라조기","춘권","차우면"],
    "양식": ["파스타","리조또","스테이크","피자","그라탱","크림","버터","치즈","샐러드","수프","오븐","그릴"],
    "동남아": ["팟타이","나시고렝","똠얌꿍","쌀국수","반미","그린커리","사테","누억맘"],
    "비건": [],
    "그 외": [],
  };

  const NON_VEGAN = ["소고기","돼지고기","닭고기","베이컨","햄","참치","연어","고등어","멸치","계란","달걀","치즈","버터","우유","크림","어간장"];

  const ALLERGEN_KEYWORDS = {
    "계란": ["계란","달걀","난백","마요네즈","에그"],
    "우유": ["우유","치즈","버터","크림","유청","요거트","연유"],
    "대두": ["대두","콩","두부","간장","된장","청국장","두유"],
    "밀": ["밀","밀가루","글루텐","빵","파스타","누들"],
    "갑각류": ["새우","대하","게","랍스터","크랩"],
    "견과류": ["땅콩","아몬드","호두","캐슈","피스타치오","잣","헤이즐넛"],
  };

  const toText = (v) => (v ? String(v).toLowerCase() : "");
  const hasAny = (hay, keys) => keys.some((k) => toText(hay).includes(toText(k)));

  const pickText = (it) => {
    const title = it.title || it.foodName || it.name || "";
    const ing =
      it.ingredients ||
      it.ingredient ||
      it.materials ||
      it.desc ||
      it.description ||
      "";
    return `${title}\n${ing}`;
  };

  const violatesVegan = (it) => foodPreference === "비건" && hasAny(pickText(it), NON_VEGAN);
  const violatesAllergy = (it) => {
    const hay = pickText(it);
    return allergies.some((a) => hasAny(hay, (ALLERGEN_KEYWORDS[a] || [a])));
  };

  const preferenceScore = (it) => {
    if (!foodPreference || !FOOD_PREF_KEYWORDS[foodPreference] || FOOD_PREF_KEYWORDS[foodPreference].length === 0) {
      return 0;
    }
    return FOOD_PREF_KEYWORDS[foodPreference].reduce(
      (acc, k) => acc + (hasAny(pickText(it), [k]) ? 1 : 0),
      0
    );
  };

  // 필터 + 재랭킹
  const filteredSorted = useMemo(() => {
    let rows = Array.isArray(baseItems) ? [...baseItems] : [];

    rows = rows.filter((r) => !violatesVegan(r) && !violatesAllergy(r));

    rows = rows
      .map((r, i) => ({ ...r, _score: preferenceScore(r), _idx: i }))
      .sort((a, b) => {
        if (b._score !== a._score) return b._score - a._score;
        return a._idx - b._idx;
      })
      .map(({ _score, _idx, ...rest }) => rest);

    if (rows.length === 0) {
      rows = baseItems.filter((r) => !violatesVegan(r) && !violatesAllergy(r));
    }
    return rows;
  }, [baseItems, foodPreference, allergies]);

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

      <div className="result-list">
        {filteredSorted.length === 0 ? (
          <div>
            <p>추천 결과가 없습니다.</p>
            {state && state.raw && (
              <pre style={{ textAlign: "left", whiteSpace: "pre-wrap" }}>
                {JSON.stringify(state.raw, null, 2)}
              </pre>
            )}
          </div>
        ) : (
          filteredSorted.map((it, idx) => {
            const title = it.title || it.foodName || it.name || `추천 ${idx + 1}`;
            const img = it.imageUrl || it.image || "/no-image.png";
            return (
              <div key={`${title}-${idx}`} className="result-card">
                <img src={img} alt={title} />
                <h3>{title}</h3>
                <button
                  className="detail"
                  onClick={() => navigate("/recipe/details", { state: { title, aiMode: true } })}
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
