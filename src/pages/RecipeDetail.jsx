
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "../styles/RecipeDetail.css";

export default function RecipeDetail() {
  const location = useLocation();
  const title = location.state?.title;


  const [data, setData] = useState(null);

  const BASE_URL = "http://210.110.33.220:8183/api";

  useEffect(() => {
    if (!title) return;
    axios
      .get(`${BASE_URL}/recipes/details/${encodeURIComponent(title)}`)
      .then((res) => setData(res.data))
      .catch((err) => console.error("레시피 상세 조회 실패:", err));
  }, [title]);

  if (!data) return <p>레시피 정보를 불러오는 중입니다...</p>;

  const { publicRecipe, userRecipe } = data;

  return (
    <div className="recipe-detail-page">
      <h1 className="recipe-title">{title}</h1>

      {/* ✅ 공공데이터 레시피 */}
      {publicRecipe && (
        <div className="public-recipe">
          <img
            src={
              publicRecipe.ATT_FILE_NO_MAIN ||
              "https://via.placeholder.com/300x200?text=No+Image"
            }
            alt={publicRecipe.RCP_NM}
            className="main-image"
          />
          <h2>🧂 재료</h2>
          <p>{publicRecipe.RCP_PARTS_DTLS}</p>

          <h2>🍳 조리 과정</h2>
          {[...Array(20)].map((_, i) => {
            const step = publicRecipe[`MANUAL${String(i + 1).padStart(2, "0")}`];
            const img = publicRecipe[`MANUAL_IMG${String(i + 1).padStart(2, "0")}`];
            if (!step && !img) return null;
            return (
              <div key={i} className="step">
                {img && <img src={img} alt={`step-${i + 1}`} />}
                <p>{step}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ✅ 사용자 등록 레시피 */}
      {userRecipe && userRecipe.length > 0 && (
        <div className="user-recipes">
          <h2>👩‍🍳 사용자 등록 레시피</h2>
          {userRecipe.map((r) => (
            <div key={r.userRecipeId} className="user-recipe-card">
              <img
                src={r.imageUrl || "https://via.placeholder.com/200x150?text=No+Image"}
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
