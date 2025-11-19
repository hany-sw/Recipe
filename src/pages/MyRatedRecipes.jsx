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
    try {
      const res = await getMyRatings();
      const ratings = res.data || [];

      // 각 평점의 recipeId로 상세정보 불러오기 (이미지 포함)
      const detailed = await Promise.all(
        ratings.map(async (r) => {
          try {
            const detail = await axios.get(`${BASE_URL}/recipes/${r.recipeId}`);
            return {
              ratingId: r.ratingId,
              recipeId: r.recipeId,
              recipeName: r.recipeName,
              ratingScore: r.ratingScore,
              createdAt: r.createdAt,
              imageUrl: detail.data.imageUrl || "/no-image.png",
              ingredients: detail.data.ingredients || "",
              description: detail.data.description || "",
            };
          } catch {
            return { ...r, imageUrl: "/no-image.png" };
          }
        })
      );
      setRatedRecipes(detailed);
    } catch (err) {
      console.error("⭐ 내가 준 평점 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRatings();
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
          recipeType: "PUBLIC", // ⚠️ USER 타입일 경우 수정 필요
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
  const handleDeleteRating = async (ratingID) => {
    if (!window.confirm("이 평점을 삭제하시겠습니까?")) return;
    try {
      await axios.delete(`${BASE_URL}/rating/delete/${ratingID}`, {
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
