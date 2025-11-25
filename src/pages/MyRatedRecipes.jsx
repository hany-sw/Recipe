import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getMyRatings } from "../api/api";
import "../styles/MyRatedRecipes.css";

export default function MyRatedRecipes() {
  const [ratedRecipes, setRatedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const BASE_URL = "http://210.110.33.220:8183/api";

  // ✅ 내가 준 평점 목록 불러오기
  const fetchMyRatings = async () => {
    setLoading(true);
    try {
      const res = await getMyRatings(); // /rating/my (인증 필수)
      const ratings = Array.isArray(res.data) ? res.data : [];

      // 각 평점의 recipeId로 상세정보 불러오기 (이미지 포함)
      const settled = await Promise.allSettled(
        ratings.map(async (r) => {
          // 백엔드 상세: 공공 레시피는 /recipe/{id}로 가정 (단수 'recipe')
          // 사용자 레시피 엔드포인트가 다르면 여기서 분기해 주세요.
          const detailUrl = `${BASE_URL}/recipe/${r.recipeId}`;

          try {
            const detail = await axios.get(detailUrl);
            const d = detail.data || {};
            return {
              ratingId: r.ratingId,
              recipeId: r.recipeId,
              recipeName: r.recipeName || d.title || d.name || `레시피 ${r.recipeId}`,
              ratingScore: r.ratingScore,
              createdAt: r.createdAt,
              imageUrl: d.imageUrl || "/no-image.png",
              ingredients: d.ingredients || "",
              description: d.description || "",
            };
          } catch {
            // 상세 못 불러와도 카드 자체는 보여주기
            return {
              ratingId: r.ratingId,
              recipeId: r.recipeId,
              recipeName: r.recipeName || `레시피 ${r.recipeId}`,
              ratingScore: r.ratingScore,
              createdAt: r.createdAt,
              imageUrl: "/no-image.png",
              ingredients: "",
              description: "",
            };
          }
        })
      );

      const detailed = settled
        .filter((s) => s.status === "fulfilled")
        .map((s) => s.value);

      setRatedRecipes(detailed);
    } catch (err) {
      console.error("⭐ 내가 준 평점 불러오기 실패:", err);
      // 토큰 만료/미로그인 대비
      if (err?.response?.status === 401) {
        alert("로그인이 필요합니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRatings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 평점 수정
  const handleUpdateRating = async (rating) => {
    const newScore = prompt("새 평점을 입력하세요 (1~5):", rating.ratingScore);
    if (!newScore) return;

    try {
      await axios.put(
        `${BASE_URL}/rating/update`,
        {
          recipeId: rating.recipeId,
          recipeType: "PUBLIC", // ⚠️ USER 타입이면 백엔드 규칙에 맞게 수정
          ratingScore: parseFloat(newScore),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      alert("평점이 수정되었습니다 ✅");
      fetchMyRatings();
    } catch (err) {
      console.error("평점 수정 실패:", err);
      alert("평점 수정 실패 ❌");
    }
  };

  // ✅ 평점 삭제
  const handleDeleteRating = async (ratingId) => {
    if (!window.confirm("이 평점을 삭제하시겠습니까?")) return;
    try {
      await axios.delete(`${BASE_URL}/rating/delete/${ratingId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      alert("평점이 삭제되었습니다 ✅");
      fetchMyRatings();
    } catch (err) {
      console.error("평점 삭제 실패:", err);
      alert("삭제 실패 ❌");
    }
  };

  return (
    <div className="my-rated-page">
      <h2>⭐ 내가 준 평점 레시피</h2>

      {loading ? (
        <p>불러오는 중...</p>
      ) : ratedRecipes.length === 0 ? (
        <p className="empty">아직 평점을 준 레시피가 없습니다.</p>
      ) : (
        <div className="favorite-list">
          {ratedRecipes.map((item) => (
            <div key={item.ratingId} className="favorite-card">
              <img
                src={item.imageUrl || "/no-image.png"}
                alt={item.recipeName || "레시피 이미지"}
                onClick={() =>
                  navigate("/recipe/details", { state: { recipe: item } })
                }
              />

              <div className="favorite-info">
                <h3>{item.recipeName || `레시피 ${item.recipeId}`}</h3>
                <p>⭐ 평점: {item.ratingScore ?? "-"}</p>
                <p>🕒 {new Date(item.createdAt).toLocaleString()}</p>

                <div className="button-group">
                  <button
                    className="edit-btn"
                    onClick={() => handleUpdateRating(item)}
                  >
                    ✏️
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteRating(item.ratingId)}
                  >
                    🗑️
                  </button>

                  <button
                    className="detail-btn"
                    onClick={() =>
                      navigate("/recipe/details", { state: { recipe: item } })
                    }
                  >
                    🔍 상세보기
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
