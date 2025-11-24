import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "../styles/RecipeDetail.css";

export default function RecipeDetail() {
  const location = useLocation();
  const BASE_URL = "http://210.110.33.220:8183/api";

  const passedRecipe = location.state?.recipe;
  const title = location.state?.title;
  const explicitAiMode = location.state?.aiMode === true;
  const userRecipesFromState = location.state?.userRecipes;

  const [data, setData] = useState(
    passedRecipe
      ? { publicRecipe: [passedRecipe], userRecipes: [] }
      : userRecipesFromState
      ? { userRecipes: userRecipesFromState }
      : null
  );
  const [loading, setLoading] = useState(!Boolean(data));
  const [error, setError] = useState("");

  /** 텍스트 → 단계 배열 */
  const splitSteps = (txt = "") => {
    if (!txt) return [];
    // 1) "1.", "2.", "STEP 1" 같은 패턴 우선 분할
    const numbered = txt
      .split(/\n+(?=\s*(?:STEP\s*\d+|[0-9]+\.)\s*)/i)
      .map(s => s.trim())
      .filter(Boolean);
    if (numbered.length > 1) {
      return numbered.map(s =>
        s.replace(/^(STEP\s*\d+|[0-9]+\.)\s*[:.\-]?\s*/i, "").trim()
      );
    }
    // 2) 줄바꿈 기준
    const lines = txt.split(/\n+/).map(s => s.trim()).filter(Boolean);
    if (lines.length > 1) return lines;
    // 3) 마침표 기준 (너무 잘게 쪼개지지 않게)
    const dots = txt.split(/(?<=\.)\s+/).map(s => s.trim()).filter(Boolean);
    return dots.length > 1 ? dots : [txt.trim()];
  };

  /** 재료 텍스트 → 항목 배열 */
  const splitIngredients = (txt = "") => {
    if (!txt) return [];
    // 공공데이터 특유 구분자까지 고려
    return txt
      .split(/[,·\n;]+/)
      .map(s => s.replace(/^-/, "").trim())
      .filter(Boolean);
  };

  /** 응답을 화면용으로 정규화 */
  const normalizeRecipe = (r) => {
    if (!r) return null;
    const title =
      r.title || r.name || r.foodName || r.baseRecipeName || "제목 없음";
    const imageUrl =
      (r.imageUrl && r.imageUrl.trim()) ||
      r.ATT_FILE_NO_MAIN ||
      "";
    const ingredientsText = r.ingredients || r.RCP_PARTS_DTLS || "";
    const descriptionText = r.description || r.RCP_WAY2 || "";

    return {
      title,
      imageUrl,
      ingredientsText,
      ingredients: splitIngredients(ingredientsText),
      steps: splitSteps(descriptionText),
      // 있으면 표시 (AI가 넣어줬거나 백엔드가 추가했다면 자동 노출)
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
  };

  useEffect(() => {
    if (data || passedRecipe || userRecipesFromState) return;
    if (!title) return;

    let canceled = false;
    const fetchDetail = async () => {
      setLoading(true);
      setError("");
      try {
        // AI 힌트가 있으면 우선 시도
        if (explicitAiMode) {
          const aiRes = await axios.get(`${BASE_URL}/ai/recipe/detail`, {
            params: { foodName: title },
          });
          if (!canceled) {
            const norm = normalizeRecipe(aiRes.data);
            setData({ publicRecipe: [norm], userRecipes: [] });
            setLoading(false);
            return;
          }
        }

        // AI 상세 먼저 → 실패 시 일반 상세
        try {
          const aiRes = await axios.get(`${BASE_URL}/ai/recipe/detail`, {
            params: { foodName: title },
          });
          if (!canceled) {
            const norm = normalizeRecipe(aiRes.data);
            setData({ publicRecipe: [norm], userRecipes: [] });
            setLoading(false);
          }
        } catch {
          const res = await axios.get(
            `${BASE_URL}/recipes/details/${encodeURIComponent(title)}`
          );
          if (!canceled) {
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
            setData({ publicRecipe: pr, userRecipes: ur });
            setLoading(false);
          }
        }
      } catch (e) {
        if (!canceled) {
          setError("레시피 상세를 불러오지 못했습니다.");
          setLoading(false);
        }
      }
    };

    fetchDetail();
    return () => {
      canceled = true;
    };
  }, [title, explicitAiMode, passedRecipe, userRecipesFromState, data]);

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
          {Object.values(first.nutrition || {}).some(v => v != null) && (
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
          onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/300x200?text=No+Image")}
        />
      )}

      {/* 재료 */}
      {first && (
        <>
          <h2>🧂 재료</h2>
          {first.ingredients.length > 0 ? (
            <ul className="ingredient-list">
              {first.ingredients.map((ing, i) => (
                <li key={i} className="chip-ing">{ing}</li>
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

      {/* 사용자 등록 레시피 (있으면 아래 묶음으로 표시) */}
      {userRecipes.length > 0 && (
        <div className="user-recipes">
          <h2>👩‍🍳 사용자 등록 레시피</h2>
          {userRecipes.map((r) => (
            <div key={r.userRecipeId} className="user-recipe-card">
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
