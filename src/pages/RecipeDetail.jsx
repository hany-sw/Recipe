// src/pages/RecipeDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "../styles/RecipeDetail.css";

export default function RecipeDetail() {
  const location = useLocation();
  const BASE_URL = "http://210.110.33.220:8183/api";

  // 라우팅으로 넘어온 값들
  const passedRecipe = location.state?.recipe;
  const titleFromState = location.state?.title;
  const explicitAiMode = location.state?.aiMode === true;
  const userRecipesFromState = location.state?.userRecipes;

  const [shopPanel, setShopPanel] = useState({
    open: false,
    ingredient: "",
    anchor: { top: 0, left: 0 },
  });

  const [data, setData] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------------- UTILS ---------------- */

  const toSearchQuery = (raw) => {
    if (!raw) return "";
    let s = String(raw).replace(/\(.*?\)/g, "").trim();
    s = s.split(",")[0].trim();
    const tokens = s.split(/\s+/);
    const nameTokens = [];
    for (const t of tokens) {
      if (/\d/.test(t)) break;
      if (/^(g|kg|mg|ml|l|컵|큰술|작은술|티스푼|스푼|마리|개|장|줌|tbsp|tsp)$/i.test(t)) break;
      nameTokens.push(t);
    }
    const name = nameTokens.join(" ").trim();
    return name || s.replace(/\d.*$/, "").trim();
  };

  const splitSteps = (txt = "") => {
    if (!txt || typeof txt !== "string") return [];
    const numbered = txt
      .split(/\n+(?=\s*(?:STEP\s*\d+|[0-9]+\.)\s*)/i)
      .map((s) => s.trim())
      .filter(Boolean);

    if (numbered.length > 1) {
      return numbered.map((s) =>
        s.replace(/^(STEP\s*\d+|[0-9]+\.)\s*[:.\-]?\s*/i, "").trim()
      );
    }
    const lines = txt.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    if (lines.length > 1) return lines;
    const dots = txt.split(/(?<=\.)\s+/).map((s) => s.trim()).filter(Boolean);
    return dots.length > 1 ? dots : [txt.trim()];
  };

  const splitIngredientsText = (txt = "") => {
    if (!txt || typeof txt !== "string") return [];
    return txt
      .split(/[,·\n;]+/)
      .map((s) => s.replace(/^-/, "").trim())
      .filter(Boolean);
  };

  const buildCookTimeFromRange = (r = {}) => {
    const toNum = (v) => {
      if (v === 0) return 0;
      if (typeof v === "number" && !Number.isNaN(v)) return v;
      if (typeof v === "string" && !Number.isNaN(Number(v))) return Number(v);
      return null;
    };
    const minN = toNum(r.minTime ?? r.minCookTime);
    const maxN = toNum(r.maxTime ?? r.maxCookTime);
    const f = (n) => (typeof n === "number" ? `${n}분` : "");
    const a = f(minN);
    const b = f(maxN);
    if (a && b) return `${a} ~ ${b}`;
    if (a) return a;
    if (b) return b;
    return "";
  };

  const normalizeAiIngredientsArray = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr
      .map((it) => {
        if (!it) return null;
        const name = (it.name ?? "").trim();
        const amount = (it.amount ?? "").trim();
        return amount ? `${name} ${amount}` : name;
      })
      .filter(Boolean);
  };

  const normalizeRecipe = (r) => {
    if (!r) return null;

    const title =
      r.title || r.name || r.foodName || r.baseRecipeName || "제목 없음";

    const imageUrl =
      (typeof r.imageUrl === "string" && r.imageUrl.trim()) ||
      r.ATT_FILE_NO_MAIN ||
      "";

    let ingredientsArr = [];
    if (Array.isArray(r.ingredients)) {
      ingredientsArr = normalizeAiIngredientsArray(r.ingredients);
    } else {
      ingredientsArr = splitIngredientsText(r.ingredients || r.RCP_PARTS_DTLS || "");
    }

    const descriptionText =
      r.description || r.RCP_WAY2 || "";

    const steps = Array.isArray(r.steps)
      ? r.steps.filter(Boolean)
      : splitSteps(descriptionText);

    const cookTime =
      buildCookTimeFromRange(r) ||
      r.time ||
      r.cookTime ||
      r.expectedTime ||
      "";

    return {
      title,
      imageUrl,
      ingredients: ingredientsArr,
      steps,
      difficulty: r.difficulty || r.level || "",
      cookTime,
      nutrition: {
        calories: r.calories ?? r.kcal ?? null,
        protein: r.protein ?? null,
        fat: r.fat ?? null,
        carbs: r.carbs ?? r.carbohydrate ?? null,
        sodium: r.sodium ?? null,
      },
    };
  };

  const initialData = useMemo(() => {
    if (passedRecipe) {
      return {
        publicRecipe: [normalizeRecipe(passedRecipe)],
        userRecipes: [],
      };
    }
    if (userRecipesFromState) {
      return { publicRecipe: [], userRecipes: userRecipesFromState };
    }
    return null;
  }, [passedRecipe, userRecipesFromState]);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  /* ---------------- Fetch Detail (항상 호출) ---------------- */

  useEffect(() => {
    const queryTitle =
      titleFromState ||
      passedRecipe?.title ||
      passedRecipe?.name ||
      passedRecipe?.foodName;

    if (!queryTitle) {
      setLoading(false);
      return;
    }

    let canceled = false;

    const fetchDetail = async () => {
      setError("");
      try {
        if (explicitAiMode) {
          const aiRes = await axios.get(`${BASE_URL}/ai/recipe/detail`, {
            params: { foodName: queryTitle },
          });
          if (canceled) return;
          const norm = normalizeRecipe(aiRes.data);
          setData({ publicRecipe: norm ? [norm] : [], userRecipes: [] });
        } else {
          const res = await axios.get(
            `${BASE_URL}/recipes/details/${encodeURIComponent(queryTitle)}`
          );
          if (canceled) return;

          const prRaw = Array.isArray(res.data?.publicRecipe)
            ? res.data.publicRecipe
            : [];
          const ur = Array.isArray(res.data?.userRecipes)
            ? res.data.userRecipes
            : [];

          const pr = prRaw.map(normalizeRecipe).filter(Boolean);

          setData({
            publicRecipe: pr,
            userRecipes: ur,
          });
        }
      } catch (err) {
        if (!canceled) setError("레시피 상세를 불러오지 못했습니다.");
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    fetchDetail();
    return () => (canceled = true);
  }, [BASE_URL, explicitAiMode, passedRecipe, titleFromState]);

  /* ---------------- UI Logic ---------------- */

  const first = data?.publicRecipe?.[0] || null;

  const onIngredientClick = (e, ingName) => {
    const rect = e.currentTarget?.getBoundingClientRect?.();
    if (!rect) {
      setShopPanel({
        open: true,
        ingredient: ingName,
        anchor: { top: 120, left: 120 },
      });
      return;
    }
    setShopPanel((prev) => {
      const isSame = prev.open && prev.ingredient === ingName;
      if (isSame) return { open: false, ingredient: "", anchor: { top: 0, left: 0 } };
      return {
        open: true,
        ingredient: ingName,
        anchor: { top: rect.bottom + 6, left: Math.max(rect.left, 12) },
      };
    });
  };

  const openSsg = () => {
    const q = encodeURIComponent(toSearchQuery(shopPanel.ingredient));
    window.open(`https://www.ssg.com/search.ssg?target=all&query=${q}`, "_blank");
  };

  const openCoupang = () => {
    const q = encodeURIComponent(toSearchQuery(shopPanel.ingredient));
    window.open(`https://www.coupang.com/np/search?component=&q=${q}`, "_blank");
  };

  const closeShopPanel = () =>
    setShopPanel({ open: false, ingredient: "", anchor: { top: 0, left: 0 } });

  /* ---------------- Render ---------------- */

  if (loading) return <p>레시피 정보를 불러오는 중입니다...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!first) return <p>레시피 정보를 찾을 수 없습니다.</p>;

  return (
    <div className="recipe-detail-page">
      <h1 className="recipe-title">
        {first.title ||
          passedRecipe?.title ||
          titleFromState ||
          data?.userRecipes?.[0]?.name ||
          "레시피 상세"}
      </h1>

      {/* 메타 정보 */}
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

      {/* 대표 이미지 */}
      {first.imageUrl && (
        <img
          src={first.imageUrl}
          alt={first.title}
          className="main-image"
          onError={(e) => {
            e.currentTarget.src =
              "https://via.placeholder.com/300x200?text=No+Image";
          }}
        />
      )}

      {/* 재료 */}
      <h2>🧂 재료</h2>
      {first.ingredients.length > 0 ? (
        <ul className="ingredient-list">
          {first.ingredients.map((ing, i) => (
            <li key={`${ing}-${i}`}>
              <button className="chip-ing" onClick={(e) => onIngredientClick(e, ing)}>
                {ing}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">재료 정보 없음</p>
      )}

      {/* 조리 단계 */}
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

      {/* 👩‍🍳 사용자 등록 레시피 (백엔드가 묶어준 결과) */}
      {Array.isArray(data?.userRecipes) && data.userRecipes.length > 0 && (
        <div className="user-recipes">
          <h2>👩‍🍳 사용자 등록 레시피</h2>
          {data.userRecipes.map((r) => (
            <div key={r.userRecipeId || r.id} className="user-recipe-card">
              <img
                src={
                  r.imageUrl && r.imageUrl.trim()
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

      {/* 쇼핑 패널 */}
      {shopPanel.open && (
        <>
          <div
            className="shop-overlay"
            onClick={closeShopPanel}
            style={{ position: "fixed", inset: 0, background: "transparent", zIndex: 998 }}
          />
          <div
            className="shop-pop"
            style={{
              position: "fixed",
              top: `${shopPanel.anchor.top}px`,
              left: `${shopPanel.anchor.left}px`,
              zIndex: 999,
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: 12,
              boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
              padding: "10px 12px",
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 12, color: "#666", marginRight: 6 }}>
              {shopPanel.ingredient}
            </span>
            <button className="btn-ssg" onClick={openSsg}>쓱배송</button>
            <button className="btn-coupang" onClick={openCoupang}>쿠팡</button>
          </div>
        </>
      )}
    </div>
  );
}
