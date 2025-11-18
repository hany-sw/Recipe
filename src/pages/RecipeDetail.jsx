//RecipeDetail 수정
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/RecipeDetail.css";

export default function RecipeDetail() {
  const location = useLocation();
  const navigate = useNavigate();

  const title = location.state?.title; // 사용자 모드/AI 모드 공통 제목
  const aiMode = location.state?.aiMode || false; // AI 모드 여부
  const userRecipesFromState = location.state?.userRecipes;

  const [data, setData] = useState(
    userRecipesFromState ? { userRecipes: userRecipesFromState } : null
  );

  const BASE_URL = "http://210.110.33.220:8183/api";

  useEffect(() => {
    if (!title) return;

    // ⭐ AI 모드일 때 API 요청 주소 변경
    if (aiMode) {
      axios
        .get(
          `${BASE_URL}/recipes/recommend/ai/detail?foodName=${encodeURIComponent(
            title
          )}`
        )
        .then((res) => {
          // AI 응답은 RecipeDto 단일 객체 → 형태 맞춰서 변환
          const aiRecipe = res.data;
          setData({ publicRecipe: [aiRecipe], userRecipes: [] });
        })
        .catch((err) => console.error("AI 레시피 상세 실패:", err));
      return;
    }

    // ⭐ 일반 모드 (공공데이터 + 사용자 레시피)
    if (!userRecipesFromState) {
      axios
        .get(`${BASE_URL}/recipes/details/${encodeURIComponent(title)}`)
        .then((res) => setData(res.data))
        .catch((err) => console.error("레시피 상세 조회 실패:", err));
    }
  }, [title, aiMode, userRecipesFromState]);

  if (!data) return <p>레시피 정보를 불러오는 중입니다...</p>;

  const { publicRecipe = [], userRecipes = [] } = data;

  return (
    <div className="recipe-detail-page">
      <h1 className="recipe-title">{title}</h1>

      {/* ⭐ 공공데이터 또는 AI 레시피 */}
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
              <p style={{ whiteSpace: "pre-line" }}>{publicRecipe.RCP_PARTS_DTLS}</p>

              <h2>🍳 조리 과정</h2>

              <p style={{ whiteSpace: "pre-line" }}>
                {r.description || "조리 과정 정보 없음"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ⭐ 사용자 레시피 */}
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
