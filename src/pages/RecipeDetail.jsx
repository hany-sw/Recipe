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

  // 쇼핑 패널 상태
  const [shopPanel, setShopPanel] = useState({
    open: false,
    ingredient: "",
    // viewport 기준 좌표 (position: fixed 에 바로 쓸 값)
    anchor: { top: 0, left: 0 },
  });

  // 데이터 상태
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------------- 유틸 ----------------
  // 재료 문자열에서 '이름'만 뽑아내기 (수량/단위/괄호 내용 제거)
const toSearchQuery = (raw) => {
  if (!raw) return "";
  // 1) 괄호 속 정보 제거: "양파(다진 것)" -> "양파"
  let s = String(raw).replace(/\(.*?\)/g, "").trim();

  // 2) 쉼표 앞만 취득: "양파, 100g" -> "양파"
  s = s.split(",")[0].trim();

  // 3) 숫자/단위 나오기 전까지만 취득
  const tokens = s.split(/\s+/);
  const nameTokens = [];
  for (const t of tokens) {
    if (/\d/.test(t)) break; // 숫자 나오면 중단 (예: 100g)
    if (/^(g|kg|mg|ml|l|컵|큰술|작은술|티스푼|스푼|마리|개|장|줌|tbsp|tsp)$/i.test(t)) break;
    nameTokens.push(t);
  }
  const name = nameTokens.join(" ").trim();

  // 4) 예외적으로 위에서 못 뽑았으면 숫자부터 잘라내기
  return name || s.replace(/\d.*$/, "").trim();
};

  const splitSteps = (txt = "") => {
    if (!txt || typeof txt !== "string") return [];
    // 1) 숫자/STEP 기반 분할
    const numbered = txt
      .split(/\n+(?=\s*(?:STEP\s*\d+|[0-9]+\.)\s*)/i)
      .map((s) => s.trim())
      .filter(Boolean);
    if (numbered.length > 1) {
      return numbered.map((s) =>
        s.replace(/^(STEP\s*\d+|[0-9]+\.)\s*[:.\-]?\s*/i, "").trim()
      );
    }
    // 2) 줄바꿈
    const lines = txt.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    if (lines.length > 1) return lines;
    // 3) 문장 단위
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

  // ⏱️ min/max → 표시 문자열
  const buildCookTimeFromRange = (r = {}) => {
    const pickNum = (v) => {
      if (v === 0) return 0;
      if (typeof v === "number" && !Number.isNaN(v)) return v;
      if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
        return Number(v);
      }
      return null;
    };
    const minN = pickNum(r.minTime ?? r.minCookTime);
    const maxN = pickNum(r.maxTime ?? r.maxCookTime);
    const fmt = (n) => (n === 0 || typeof n === "number" ? `${n}분` : "");
    const a = fmt(minN);
    const b = fmt(maxN);
    if (a && b) return `${a} ~ ${b}`;
    if (a) return a;
    if (b) return b;
    return "";
  };

  // 재료 필드가 배열(객체)인 AI 포맷 → 문자열 배열로 변환
  const normalizeAiIngredientsArray = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr
      .map((it) => {
        if (!it) return null;
        // 백엔드의 AIRecipeDto.Ingredient {name, amount}
        const name = (it.name ?? "").toString().trim();
        const amount = (it.amount ?? "").toString().trim();
        if (!name && !amount) return null;
        return amount ? `${name} ${amount}`.trim() : name;
      })
      .filter(Boolean);
  };

  // 응답 → 화면용 노멀라이즈
  const normalizeRecipe = (r) => {
    if (!r) return null;

    const title =
      r.title || r.name || r.foodName || r.baseRecipeName || "제목 없음";

    const imageUrl =
      (typeof r.imageUrl === "string" && r.imageUrl.trim()) ||
      r.ATT_FILE_NO_MAIN ||
      "";

    // ingredients는 AI(배열) 또는 공공데이터(문자열) 모두 지원
    let ingredientsArr = [];
    if (Array.isArray(r.ingredients)) {
      ingredientsArr = normalizeAiIngredientsArray(r.ingredients);
    } else {
      ingredientsArr = splitIngredientsText(r.ingredients || r.RCP_PARTS_DTLS || "");
    }

    const descriptionText =
      r.description || r.RCP_WAY2 || ""; // AI/공공데이터 모두 대응

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

  // passedRecipe가 있으면 바로 1차 노출용으로 메모
  const initialData = useMemo(() => {
    if (passedRecipe) {
      return {
        publicRecipe: [normalizeRecipe(passedRecipe)].filter(Boolean),
        userRecipes: [],
      };
    }
    if (userRecipesFromState) {
      return { publicRecipe: [], userRecipes: userRecipesFromState };
    }
    return null;
  }, [passedRecipe, userRecipesFromState]);

  // 첫 렌더에 초기값 반영
  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
    }
  }, [initialData]);

  // 상세 로드
  useEffect(() => {
    const queryTitle =
      titleFromState ||
      passedRecipe?.title ||
      passedRecipe?.name ||
      passedRecipe?.foodName;

    // 타이틀이 전혀 없고, initialData도 없다면 종료
    if (!queryTitle && !initialData) {
      setLoading(false);
      setData(null);
      return;
    }

    let canceled = false;

    const fetchDetail = async () => {
      // 초기값이 이미 화면에 있을 수 있으니 UX를 위해 loading을 강제 true로 안 바꿈
      setError("");
      try {
        if (explicitAiMode) {
          const aiRes = await axios.get(`${BASE_URL}/ai/recipe/detail`, {
            params: { foodName: queryTitle },
          });
          if (canceled) return;
          const norm = normalizeRecipe(aiRes.data);
          setData({ publicRecipe: norm ? [norm] : [], userRecipes: [] });
        } else if (queryTitle) {
          const res = await axios.get(
            `${BASE_URL}/recipes/details/${encodeURIComponent(queryTitle)}`
          );
          if (canceled) return;

          const prRaw = Array.isArray(res.data?.publicRecipe)
            ? res.data.publicRecipe
            : res.data?.publicRecipe
            ? [res.data.publicRecipe]
            : [];
          const ur = Array.isArray(res.data?.userRecipes)
            ? res.data.userRecipes
            : res.data?.userRecipes
            ? [res.data.userRecipes]
            : [];

          const pr = prRaw.map(normalizeRecipe).filter(Boolean);

          setData({
            publicRecipe: pr,
            userRecipes: ur,
          });
        }
      } catch (e) {
        if (!canceled) {
          setError("레시피 상세를 불러오지 못했습니다.");
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    // passedRecipe만 있고 원격 조회가 필요 없으면 스킵
    if (explicitAiMode || (titleFromState && !passedRecipe)) {
      fetchDetail();
    } else if (!initialData) {
      // 타이틀만 있는 일반 케이스
      fetchDetail();
    }

    return () => {
      canceled = true;
    };
  }, [BASE_URL, explicitAiMode, passedRecipe, titleFromState, initialData]);

  // ---------------- UI 헬퍼 ----------------
  const first = data?.publicRecipe?.[0] || null;

  // 재료 칩 클릭 → 패널 토글
  const onIngredientClick = (e, ingName) => {
    // 클릭된 버튼의 사각형을 "그 자리에서" 확보
    const rect = e.currentTarget?.getBoundingClientRect?.();
    if (!rect) {
      // 안전장치: 좌표 못 구하면 중앙 근처에 띄움
      setShopPanel((prev) => {
        const isSame = prev.open && prev.ingredient === ingName;
        return isSame
          ? { open: false, ingredient: "", anchor: { top: 0, left: 0 } }
          : {
              open: true,
              ingredient: ingName,
              anchor: { top: 120, left: 120 },
            };
      });
      return;
    }

    setShopPanel((prev) => {
      const isSame = prev.open && prev.ingredient === ingName;
      if (isSame) {
        // 같은 재료 재클릭 → 닫기
        return { open: false, ingredient: "", anchor: { top: 0, left: 0 } };
      }
      return {
        open: true,
        ingredient: ingName,
        // position: fixed 기준이므로 viewport 좌표 그대로 사용
        anchor: { top: rect.bottom + 6, left: Math.max(rect.left, 12) },
      };
    });
  };

  const closeShopPanel = () =>
    setShopPanel({ open: false, ingredient: "", anchor: { top: 0, left: 0 } });

  const openSsg = () => {
  const q = encodeURIComponent(toSearchQuery(shopPanel.ingredient));
  window.open(`https://www.ssg.com/search.ssg?target=all&query=${q}`, "_blank");
};

const openCoupang = () => {
  const q = encodeURIComponent(toSearchQuery(shopPanel.ingredient));
  window.open(`https://www.coupang.com/np/search?component=&q=${q}`, "_blank");
};


  // ---------------- 렌더 ----------------
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

      {/* 메타(난이도/시간/영양) */}
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

      {/* 대표 이미지 (있을 때만) */}
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
              <button
                className="chip-ing"
                onClick={(e) => onIngredientClick(e, ing)}
              >
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

      {/* 사용자 등록 레시피 (백엔드가 묶어준 경우) */}
      {Array.isArray(data?.userRecipes) && data.userRecipes.length > 0 && (
        <div className="user-recipes">
          <h2>👩‍🍳 사용자 등록 레시피</h2>
          {data.userRecipes.map((r) => (
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

      {/* 쇼핑 패널 + 배경 클릭 닫기 */}
      {shopPanel.open && (
        <>
          {/* 배경 클릭 시 닫기 */}
          <div
            className="shop-overlay"
            onClick={closeShopPanel}
            style={{
              position: "fixed",
              inset: 0,
              background: "transparent",
              zIndex: 998,
            }}
          />
          {/* 패널 (position: fixed, 클릭된 칩 바로 아래) */}
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
