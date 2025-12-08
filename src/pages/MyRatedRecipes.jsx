// src/pages/MyRatedRecipes.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getMyRatings } from "../api/api";
import "../styles/MyRatedRecipes.css";
import "../styles/common.css";

export default function MyRatedRecipes() {
  const [ratedRecipes, setRatedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const BASE_URL = "http://210.104.76.141:8183/api";

  // ⭐ 내가 준 평점 + 이미지 불러오기
  const fetchMyRatings = async () => {
    setLoading(true);
    try {
      const res = await getMyRatings();
      const ratings = Array.isArray(res.data) ? res.data : [];

      const settled = await Promise.allSettled(
        ratings.map(async (r) => {
          const title = r.recipeName;

          try {
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
            };
          } catch {
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

      setRatedRecipes(
        settled.filter((s) => s.status === "fulfilled").map((s) => s.value)
      );
    } catch {
      alert("평점을 불러오지 못했습니다.");
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
    } catch {
      alert("수정 실패");
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
    } catch {
      alert("삭제 실패");
    }
  };

  return (
    <div className="page-container my-rated-page">
      <h2 className="page-title">
        <span className="page-title-icon">⭐</span>
        내가 준 평점 레시피
      </h2>

      {loading ? (
        <p>불러오는 중...</p>
      ) : ratedRecipes.length === 0 ? (
        <p className="empty">평점을 준 레시피가 없습니다.</p>
      ) : (
        <div className="rated-list">
          {ratedRecipes.map((item) => (
            <div
              key={item.ratingId}
              className="rated-card"
              onClick={() =>
                navigate("/recipe/details", {
                  state: { title: item.recipeName },
                })
              }
            >
              {/* 🔥 이미지 표시 (자유게시판 아이콘 위치) */}
              <div className="rated-img-wrap">
                <img src={item.imageUrl} alt={item.recipeName} />
              </div>

              {/* 오른쪽 내용 */}
              <div className="rated-body">
                <div className="rated-title">{item.recipeName}</div>
                <div className="rated-content-preview">⭐ {item.ratingScore}</div>

                <div className="rated-info">
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>

                <div className="post-actions">
                  <button
                    className="edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateRating(item);
                    }}
                  >
                    ✏️ 수정
                  </button>

                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRating(item.ratingId);
                    }}
                  >
                    🗑 삭제
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
