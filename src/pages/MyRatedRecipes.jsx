// src/pages/MyRatedRecipes.jsx

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

  // ⭐ 내가 준 평점 목록 + 상세 이미지 불러오기
  const fetchMyRatings = async () => {
    setLoading(true);
    try {
      const res = await getMyRatings();
      const ratings = Array.isArray(res.data) ? res.data : [];

      // 상세 정보 병렬 요청
      const settled = await Promise.allSettled(
        ratings.map(async (r) => {
          const title = r.recipeName;

          try {
            // 🔥 RecipeDetail API 활용 (제목 기반)
            const detail = await axios.get(
              `${BASE_URL}/recipes/details/${encodeURIComponent(title)}`
            );

            const d = detail.data.publicRecipe?.[0] || {};

            return {
              ratingId: r.ratingId,
              recipeId: r.recipeId,
              recipeName: title,
              ratingScore: r.ratingScore,
              createdAt: r.createdAt,
              imageUrl:
                d.imageUrl ||
                d.ATT_FILE_NO_MAIN ||
                "https://via.placeholder.com/200x150?text=No+Image",
              ingredients: d.ingredients || "",
              description: d.description || "",
            };
          } catch (err) {
            console.error("상세 불러오기 실패:", err);
            // 상세 정보 실패해도 카드 자체는 표시
            return {
              ratingId: r.ratingId,
              recipeId: r.recipeId,
              recipeName: title,
              ratingScore: r.ratingScore,
              createdAt: r.createdAt,
              imageUrl: "https://via.placeholder.com/200x150?text=No+Image",
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
      if (err?.response?.status === 401) {
        alert("로그인이 필요합니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRatings();
  }, []);

  // ⭐ 평점 수정
  const handleUpdateRating = async (rating) => {
    const newScore = prompt("새 평점을 입력하세요 (1~5):", rating.ratingScore);
    if (!newScore) return;

    try {
      await axios.put(
        `${BASE_URL}/rating/update`,
        {
          recipeId: rating.recipeId,
          recipeType: "PUBLIC",
          ratingScore: parseFloat(newScore),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      alert("평점이 수정되었습니다.");
      fetchMyRatings();
    } catch (err) {
      console.error("평점 수정 실패:", err);
      alert("수정 실패 ❌");
    }
  };

  // ⭐ 평점 삭제
  const handleDeleteRating = async (ratingId) => {
    if (!window.confirm("삭제하시겠습니까?")) return;

    try {
      await axios.delete(`${BASE_URL}/rating/delete/${ratingId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });

      alert("삭제되었습니다.");
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
        <p className="empty">평점을 준 레시피가 없습니다.</p>
      ) : (
        <div className="favorite-list">
          {ratedRecipes.map((item) => (
            <div
              key={item.ratingId}
              className="favorite-card"
              onClick={() =>
                navigate("/recipe/details", {
                  state: { title: item.recipeName }, // 🔥 핵심: 제목으로 상세보기 이동
                })
              }
            >
              <img
                src={item.imageUrl}
                alt={item.recipeName}
                className="thumb"
              />

              <div className="favorite-info">
                <h3>{item.recipeName}</h3>
                <p>⭐ 평점: {item.ratingScore ?? "-"}</p>
                <p>🕒 {new Date(item.createdAt).toLocaleString()}</p>

                <div className="button-group">
                  <button
                    className="edit-btn"
                    onClick={(e) => {
                      e.stopPropagation(); // 카드 클릭 차단
                      handleUpdateRating(item);
                    }}
                  >
                    ✏️
                  </button>

                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRating(item.ratingId);
                    }}
                  >
                    🗑️
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
