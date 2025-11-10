import { useLocation } from "react-router-dom";
import "../styles/RecipeDetail.css";


export default function RecipeDetail() {
  const location = useLocation();
  const recipe = location.state?.recipe;

  if (!recipe) {
    return <p>레시피 정보를 불러올 수 없습니다.</p>;
  }

  // ✅ 조리 단계 1~20 모두 수집 (공백도 유지)
  const steps = [];
  for (let i = 1; i <= 20; i++) {
    const key = String(i).padStart(2, "0");
    const text = recipe[`MANUAL${key}`];
    const img = recipe[`MANUAL_IMG${key}`];

    // ✅ 공공데이터 일부가 \r\n으로 끝남 → 정리
    const cleanedText = text ? text.replace(/\s+/g, " ").trim() : "";
    const cleanedImg = img ? img.trim() : "";

    // ✅ 내용이 완전히 없으면 생략, 마지막까지 모두 확인
    if (cleanedText !== "" || cleanedImg !== "") {
      steps.push({ text: cleanedText, img: cleanedImg });
    }
  }

  return (
    <div className="recipe-detail-page">
      <h1 className="recipe-title">{recipe.RCP_NM}</h1>

      <div className="recipe-main">
        <img
          src={
            recipe.ATT_FILE_NO_MAIN ||
            "https://via.placeholder.com/300x200?text=No+Image"
          }
          alt={recipe.RCP_NM}
          className="main-image"
        />
      </div>

      <section className="ingredients">
        <h2>🧂 재료</h2>
        <p>{recipe.RCP_PARTS_DTLS || "재료 정보가 없습니다."}</p>
      </section>

      <section className="steps">
        <h2>🍳 조리 과정</h2>
        {steps.length > 0 ? (
          steps.map((step, idx) => (
            <div key={idx} className="step">
              {step.img && (
                <img
                  src={step.img}
                  alt={`step-${idx + 1}`}
                  className="step-image"
                />
              )}
              <p>
                {step.text !== ""
                  ? step.text
                  : `(${idx + 1}단계 설명 없음)`}
              </p>
            </div>
          ))
        ) : (
          <p>조리 과정 정보가 없습니다 😢</p>
        )}
      </section>
    </div>
  );
}
