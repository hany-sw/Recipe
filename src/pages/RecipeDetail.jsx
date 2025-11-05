import { useLocation, useNavigate } from "react-router-dom";
import "../styles/RecipeDetail.css";

export default function RecipeDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const recipe = state?.recipe;

  if (!recipe)
    return (
      <div style={{ textAlign: "center", padding: "30px" }}>
        <p>레시피 데이터를 불러올 수 없습니다 😢</p>
        <button
          style={{
            marginTop: "15px",
            padding: "8px 16px",
            background: "#ff8b3d",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
          onClick={() => navigate(-1)}
        >
          ← 뒤로가기
        </button>
      </div>
    );

  return (
    <div className="recipe-detail-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← 뒤로가기
      </button>

      <h1>{recipe.RCP_NM}</h1>
      <img
        src={recipe.ATT_FILE_NO_MAIN}
        alt={recipe.RCP_NM}
        className="recipe-img"
      />

      <section className="recipe-section">
        <h3>🧂 재료</h3>
        <p>{recipe.RCP_PARTS_DTLS}</p>
      </section>

      <section className="recipe-section">
        <h3>🍳 조리 방법</h3>
        {[...Array(20).keys()].map((i) => {
          const step = recipe[`MANUAL${String(i + 1).padStart(2, "0")}`];
          return step ? <p key={i}>{step}</p> : null;
        })}
      </section>
    </div>
  );
}
