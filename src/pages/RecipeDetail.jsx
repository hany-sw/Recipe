// src/pages/RecipeDetail.jsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "../styles/RecipeDetail.css";

export default function RecipeDetail() {
  const location = useLocation();
  const BASE_URL = "http://210.110.33.220:8183/api";

  // ✅ 라우팅으로 넘어온 값들
  const passedRecipe = location.state?.recipe;       // 카드에서 직접 넘겨준 레시피 객체
  const title = location.state?.title;               // 문자열 제목으로 넘어온 경우
  const explicitAiMode = location.state?.aiMode === true; // AI 상세보기 플래그
  const userRecipesFromState = location.state?.userRecipes; // (있다면) 외부에서 같이 넘김

  // ✅ 초기 상태: passedRecipe가 있으면 "즉시 렌더"용으로만 먼저 세팅
  const [data, setData] = useState(
    passedRecipe
      ? { publicRecipe: [normalizeRecipeInit(passedRecipe)], userRecipes: [] }
      : userRecipesFromState
      ? { userRecipes: userRecipesFromState }
      : null
  );
  const [loading, setLoading] = useState(!Boolean(data));
  const [error, setError] = useState("");

  /**
   * 초기 normalize: passedRecipe 같은 미리 보기용 객체를
   * 화면에 바로 보일 수 있도록 최소 변환 (아래 normalizeRecipe와 동일 로직 사용)
   */
  function normalizeRecipeInit(r) {
    if (!r) return null;
    const t =
      r.title || r.name || r.foodName || r.baseRecipeName || "제목 없음";
    const img =
      (r.imageUrl && r.imageUrl.trim()) ||
      r.ATT_FILE_NO_MAIN ||
      "";
    const ingText = r.ingredients || r.RCP_PARTS_DTLS || "";
    const descText = r.description || r.RCP_WAY2 || "";

    return {
      title: t,
      imageUrl: img,
      ingredientsText: ingText,
      ingredients: splitIngredients(ingText),
      steps: splitSteps(descText),
      difficulty: r.difficulty || r.level || "",
      cookTime: r.time || r.cookTime || r.expectedTime || "",
      nutrition: {
        calories: r.calories ?? r.kcal ?? null,
        protein: r.protein ?? null,
        fat: r.fat ?? null,
        carbs: r.carbs ?? r.carbohydrate ?? null,
        sodium: r.sodium ?? null,
      },
    };
  }

  /** 텍스트 → 단계 배열 */
  function splitSteps(txt = "") {
    if (!txt) return [];
    // 1) "1.", "2.", "STEP 1" 같은 패턴 우선
    const numbered = txt
      .split(/\n+(?=\s*(?:STEP\s*\d+|[0-9]+\.)\s*)/i)
      .map((s) => s.trim())
      .filter(Boolean);
    if (numbered.length > 1) {
      return numbered.map((s) =>
        s.replace(/^(STEP\s*\d+|[0-9]+\.)\s*[:.\-]?\s*/i, "").trim()
      );
    }
    // 2) 줄바꿈 기준
    const lines = txt.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    if (lines.length > 1) return lines;
    // 3) 마침표 기준
    const dots = txt.split(/(?<=\.)\s+/).map((s) => s.trim()).filter(Boolean);
    return dots.length > 1 ? dots : [txt.trim()];
  }

  /** 재료 텍스트 → 항목 배열 */
  function splitIngredients(txt = "") {
    if (!txt) return [];
    // 공공데이터 구분자 포함
    return txt
      .split(/[,·\n;]+/)
      .map((s) => s.replace(/^-/, "").trim())
      .filter(Boolean);
  }

  /** 응답을 화면용으로 정규화 */
  function normalizeRecipe(r) {
    if (!r) return null;
    const t =
      r.title || r.name || r.foodName || r.baseRecipeName || "제목 없음";
    const img =
      (r.imageUrl && r.imageUrl.trim()) ||
      r.ATT_FILE_NO_MAIN ||
      "";
    const ingText = r.ingredients || r.RCP_PARTS_DTLS || "";
    const descText = r.description || r.RCP_WAY2 || "";

    return {
      title: t,
      imageUrl: img,
      ingredientsText: ingText,
      ingredients: splitIngredients(ingText),
      steps: splitSteps(descText),
      difficulty: r.difficulty || r.level || "",
      cookTime: r.time || r.cookTime || r.expectedTime || "",
      nutrition: {
        calories: r.calories ?? r.kcal ?? null,
        protein: r.protein ?? null,
        fat: r.fat ?? null,
        carbs: r.carbs ?? r.carbohydrate ?? null,
        sodium: r.sodium ?? null,
      },
    };
  }

  useEffect(() => {
    // 제목 결정: title이 없다면 passedRecipe의 제목/이름으로 보완
    const queryTitle =
      title ||
      passedRecipe?.title ||
      passedRecipe?.name ||
      passedRecipe?.foodName;

    if (!queryTitle) return;

    let canceled = false;

    const fetchDetail = async () => {
      setLoading(true);
      setError("");
      try {
        if (explicitAiMode) {
          // ✅ AI 모드: AI 상세만 사용 (userRecipes는 붙지 않음)
          const aiRes = await axios.get(`${BASE_URL}/ai/recipe/detail`, {
            params: { foodName: queryTitle },
          });
          if (canceled) return;
          const norm = normalizeRecipe(aiRes.data);
          setData({ publicRecipe: [norm], userRecipes: [] });
        } else {
          // ✅ 일반 상세: 공공데이터 + 사용자 레시피를 백엔드에서 묶어 준 응답 사용
          const res = await axios.get(
            `${BASE_URL}/recipes/details/${encodeURIComponent(queryTitle)}`
          );
          if (canceled) return;

          const pr = Array.isArray(res.data?.publicRecipe)
            ? res.data.publicRecipe.map(normalizeRecipe)
            : res.data?.publicRecipe
            ? [normalizeRecipe(res.data.publicRecipe)]
            : [];

          const ur = Array.isArray(res.data?.userRecipes)
            ? res.data.userRecipes
            : res.data?.userRecipes
            ? [res.data.userRecipes]
            : [];

          // 📌 passedRecipe가 있었다면, 백엔드 결과와 중복되지 않게 머지
          const mergedPublic = (() => {
            if (!passedRecipe) return pr;
            const keyOf = (x) => (x?.title || x?.name || "").trim();
            const already = new Set(pr.map((x) => keyOf(x)));
            const curKey = keyOf(passedRecipe);
            const normalizedPassed = normalizeRecipeInit(passedRecipe);
            return already.has(curKey)
              ? pr
              : [normalizedPassed, ...pr];
          })();

          setData({ publicRecipe: mergedPublic, userRecipes: ur });
        }
      } catch (e) {
        if (!canceled) {
          setError("레시피 상세를 불러오지 못했습니다.");
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    fetchDetail();
    return () => {
      canceled = true;
    };
    // 의존성: 제목/모드만 따라가게 (passedRecipe 변경으로 불필요한 재호출 방지)
  }, [title, explicitAiMode]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <p>레시피 정보를 불러오는 중입니다...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!data) return <p>레시피 정보를 찾을 수 없습니다.</p>;

  const { publicRecipe = [], userRecipes = [] } = data;
  const first = publicRecipe[0];

  return (
    <div className="recipe-detail-page">
      <h1 className="recipe-title">
        {first?.title ||
          passedRecipe?.title ||
          title ||
          userRecipes?.[0]?.name ||
          "레시피 상세"}
      </h1>

      {/* 메타(난이도/시간/영양) */}
      {first && (
        <div className="meta-cards">
          {first.difficulty && (
            <div className="meta-card">
              <div className="meta-label">난이도</div>
              <div className="meta-value">{first.difficulty}</div>
            </div>
          )}
          {first.cookTime && (
            <div className="meta-card">
              <div className="meta-label">예상 시간</div>
              <div className="meta-value">{first.cookTime}</div>
            </div>
          )}
          {Object.values(first.nutrition || {}).some((v) => v != null) && (
            <div className="meta-card wide">
              <div className="meta-label">영양 정보</div>
              <div className="nutri-row">
                {first.nutrition.calories != null && (
                  <span>칼로리 {first.nutrition.calories} kcal</span>
                )}
                {first.nutrition.protein != null && (
                  <span>단백질 {first.nutrition.protein} g</span>
                )}
                {first.nutrition.fat != null && (
                  <span>지방 {first.nutrition.fat} g</span>
                )}
                {first.nutrition.carbs != null && (
                  <span>탄수화물 {first.nutrition.carbs} g</span>
                )}
                {first.nutrition.sodium != null && (
                  <span>나트륨 {first.nutrition.sodium} mg</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 대표 이미지 */}
      {first?.imageUrl && (
        <img
          src={first.imageUrl}
          alt={first.title}
          className="main-image"
          onError={(e) =>
            (e.currentTarget.src =
              "https://via.placeholder.com/300x200?text=No+Image")
          }
        />
      )}

      {/* 재료 */}
      {first && (
        <>
          <h2>🧂 재료</h2>
          {first.ingredients.length > 0 ? (
            <ul className="ingredient-list">
              {first.ingredients.map((ing, i) => (
                <li key={i} className="chip-ing">
                  {ing}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">재료 정보 없음</p>
          )}
        </>
      )}

      {/* 조리 단계 */}
      {first && (
        <>
          <h2>🍳 조리 단계</h2>
          {first.steps.length > 0 ? (
            <ol className="steps">
              {first.steps.map((step, idx) => (
                <li key={idx} className="step-item">
                  <div className="step-index">{idx + 1}</div>
                  <div className="step-body">{step}</div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">조리 과정 정보 없음</p>
          )}
        </>
      )}

      {/* 사용자 등록 레시피 (일반 상세에서만 백엔드가 묶어준 내용 표시) */}
      {userRecipes.length > 0 && (
        <div className="user-recipes">
          <h2>👩‍🍳 사용자 등록 레시피</h2>
          {userRecipes.map((r) => (
            <div key={r.userRecipeId || r.id || r.name} className="user-recipe-card">
              <img
                src={
                  r.imageUrl && r.imageUrl.trim() !== ""
                    ? r.imageUrl
                    : "https://via.placeholder.com/200x150?text=No+Image"
                }
                alt={r.name}
              />
              <h3>{r.name}</h3>
              <p>{r.description}</p>
              <p>재료: {r.ingredients}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
