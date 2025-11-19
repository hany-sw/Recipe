import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "../styles/RecipeDetail.css";

export default function RecipeDetail() {
  const location = useLocation();
  const BASE_URL = "http://210.110.33.220:8183/api";

  // ✅ 전달된 데이터 구조
  const passedRecipe = location.state?.recipe; // 즐겨찾기 등에서 직접 넘겨준 객체
  const title = location.state?.title; // AI/공공데이터 모드에서 넘겨준 제목
  const aiMode = location.state?.aiMode || false;
  const userRecipesFromState = location.state?.userRecipes;

  const [data, setData] = useState(
    passedRecipe
      ? { publicRecipe: [passedRecipe], userRecipes: [] }
      : userRecipesFromState
      ? { userRecipes: userRecipesFromState }
      : null
  );

  useEffect(() => {
    if (data || passedRecipe) return; // 이미 state에서 데이터 받았으면 API 호출 안 함
    if (!title) return;

    if (aiMode) {
      axios
        .get(
          `${BASE_URL}/recipes/recommend/ai/detail?foodName=${encodeURIComponent(
            title
          )}`
        )
        .then((res) => {
          const aiRecipe = res.data;
          setData({ publicRecipe: [aiRecipe], userRecipes: [] });
        })
        .catch((err) => console.error("AI 레시피 상세 실패:", err));
    } else if (!userRecipesFromState) {
      axios
        .get(`${BASE_URL}/recipes/details/${encodeURIComponent(title)}`)
        .then((res) => setData(res.data))
        .catch((err) => console.error("레시피 상세 조회 실패:", err));
    }
  }, [title, aiMode, userRecipesFromState, passedRecipe, data]);

  if (!data) return <p>레시피 정보를 불러오는 중입니다...</p>;

  const { publicRecipe = [], userRecipes = [] } = data;

  return (
    <div className="recipe-detail-page">
      <h1 className="recipe-title">
        {passedRecipe?.title || title || userRecipes[0]?.name}
      </h1>

      {publicRecipe.length > 0 && (
        <div className="public-recipe">
          {publicRecipe.map((r, idx) => (
            <div key={idx}>
              <img
                src={
                  r.imageUrl && r.imageUrl.trim() !== ""
                    ? r.imageUrl
                    : "https://via.placeholder.com/300x200?text=No+Image"
                }
                alt={r.title}
                className="main-image"
              />
              <h2>🧂 재료</h2>
              <p>{r.ingredients || "재료 정보 없음"}</p>

              <h2>🍳 조리 과정</h2>
              <p style={{ whiteSpace: "pre-line" }}>
                {r.description || "조리 과정 정보 없음"}
              </p>
            </div>
          ))}
        </div>
      )}

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
