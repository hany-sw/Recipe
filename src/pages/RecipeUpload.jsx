// src/pages/RecipeUpload.jsx
import { useState, useEffect } from "react";
import { getProfile } from "../api/api";
import instance from "../api/api";

import "../styles/common.css";
import "../styles/RecipeUpload.css";

export default function RecipeUpload() {
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const [recipe, setRecipe] = useState({
    name: "",
    description: "",
    imageUrl: "",
    ingredients: "",
    baseRecipeName: "",
  });

  const [myRecipes, setMyRecipes] = useState([]);

  /* -----------------------------------
     로그인 사용자 불러오기
  ----------------------------------- */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getProfile();
        setUser(response.data);
      } catch {
        alert("로그인 후 이용해주세요!");
        window.location.href = "/login";
      }
    };
    fetchUser();
  }, []);

  /* -----------------------------------
     내 레시피 목록 로드
  ----------------------------------- */
  const loadUserRecipes = async () => {
    if (!user) return;
    try {
      const res = await instance.get(`/recipes/my`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      setMyRecipes(res.data);
    } catch (err) {
      console.error("레시피 불러오기 실패:", err);
    }
  };

  useEffect(() => {
    if (user) loadUserRecipes();
  }, [user]);

  /* -----------------------------------
     레시피 등록 / 수정
  ----------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!recipe.name.trim() || !recipe.description.trim()) {
      alert("이름과 설명을 입력해주세요!");
      return;
    }

    const payload = {
      name: recipe.name.trim(),
      description: recipe.description.trim(),
      imageUrl: recipe.imageUrl.trim() || null,
      ingredients: recipe.ingredients.trim() || "",
      baseRecipeName: recipe.baseRecipeName.trim() || "",
      user: { userId: user?.userId || null },
    };

    try {
      if (isEditMode) {
        await instance.put(`/recipes/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });
        alert("레시피가 수정되었습니다!");
      } else {
        await instance.post(`/recipes/user`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });
        alert("레시피가 등록되었습니다!");
      }

      loadUserRecipes();
      resetForm();
    } catch (err) {
      console.error("레시피 등록/수정 실패:", err);
      alert("⚠ 서버 오류: 레시피를 처리할 수 없습니다.");
    }
  };

  /* -----------------------------------
     수정 모드
  ----------------------------------- */
  const handleEdit = (r) => {
    setIsModalOpen(true);
    setIsEditMode(true);
    setEditingId(r.userRecipeId);
    setRecipe({
      name: r.name || "",
      description: r.description || "",
      imageUrl: r.imageUrl || "",
      ingredients: r.ingredients || "",
      baseRecipeName: r.baseRecipeName || "",
    });
  };

  /* -----------------------------------
     삭제
  ----------------------------------- */
  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await instance.delete(`/recipes/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      alert("삭제되었습니다!");
      loadUserRecipes();
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  /* -----------------------------------
     Reset Form
  ----------------------------------- */
  const resetForm = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingId(null);
    setRecipe({
      name: "",
      description: "",
      imageUrl: "",
      ingredients: "",
      baseRecipeName: "",
    });
  };

  /* -----------------------------------
     UI 렌더링
  ----------------------------------- */
  return (
    <div className="page-container">

      {/* 페이지 제목 */}
      <h2 className="page-title">
        <span className="page-title-icon">🍳</span>
        나만의 레시피 관리
      </h2>

      {/* 플로팅 버튼 */}
      <button className="add-btn" onClick={() => setIsModalOpen(true)}>
        ✏️
      </button>

      {/* 업로드/수정 모달 */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-upload" onClick={(e) => e.stopPropagation()}>
            <button className="modal-upload-close" onClick={resetForm}>✖</button>

            <h2 className="modal-upload-title">
              {isEditMode ? "레시피 수정" : "나만의 레시피 등록"}
            </h2>

            <form className="upload-form" onSubmit={handleSubmit}>
              <label>레시피 이름</label>
              <input
                type="text"
                value={recipe.name}
                onChange={(e) => setRecipe({ ...recipe, name: e.target.value })}
                required
              />

              <label>설명</label>
              <textarea
                value={recipe.description}
                onChange={(e) =>
                  setRecipe({ ...recipe, description: e.target.value })
                }
                required
              />

              <label>이미지 URL</label>
              <input
                type="text"
                placeholder="예: https://example.com/image.jpg"
                value={recipe.imageUrl}
                onChange={(e) => setRecipe({ ...recipe, imageUrl: e.target.value })}
              />

              <label>재료 (쉼표로 구분)</label>
              <input
                type="text"
                placeholder="예: 달걀, 밀가루, 설탕"
                value={recipe.ingredients}
                onChange={(e) =>
                  setRecipe({ ...recipe, ingredients: e.target.value })
                }
              />

              <label>기본 레시피 이름 (선택)</label>
              <input
                type="text"
                placeholder="예: 기본 김치찌개"
                value={recipe.baseRecipeName}
                onChange={(e) =>
                  setRecipe({ ...recipe, baseRecipeName: e.target.value })
                }
              />

              <button type="submit" className="submit-btn">
                {isEditMode ? "수정하기" : "등록하기"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 📌 업로드된 레시피 목록 (가로 카드 UI 적용) */}
      <div className="my-recipe-list">
        {myRecipes.length === 0 ? (
          <p className="empty">등록된 레시피가 없습니다</p>
        ) : (
          <div className="my-recipe-items">
            {myRecipes.map((r) => (
              <div
                key={r.userRecipeId}
                className="my-recipe-card"
                onClick={() => setSelectedRecipe(r)}
              >
                {/* 왼쪽 이미지 */}
                <div className="my-recipe-img-wrap">
                  <img
                    src={
                      r.imageUrl && r.imageUrl.trim()
                        ? r.imageUrl
                        : "https://via.placeholder.com/150?text=No+Image"
                    }
                    alt={r.name}
                  />
                </div>

                {/* 오른쪽 내용 */}
                <div className="my-recipe-body">
                  <h3 className="my-recipe-title">{r.name}</h3>

                  <div className="my-recipe-ing-list">
                    {(r.ingredients || "")
                      .split(/[,·\n;]+/)
                      .map((i, idx) => (
                        <span key={idx} className="my-recipe-chip">
                          {i.trim()}
                        </span>
                      ))}
                  </div>

                  <div className="my-recipe-actions">
                    <button
                      className="my-edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(r);
                      }}
                    >
                      ✏️ 수정
                    </button>

                    <button
                      className="my-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(r.userRecipeId);
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

      {/* 📌 상세보기 모달 */}
      {selectedRecipe && (
        <div className="modal-overlay" onClick={() => setSelectedRecipe(null)}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="upload-modal-close"
              onClick={() => setSelectedRecipe(null)}
            >
              ✖
            </button>

            <h2 className="upload-modal-title">{selectedRecipe.name}</h2>

            {selectedRecipe.imageUrl && (
              <img
                src={selectedRecipe.imageUrl}
                alt={selectedRecipe.name}
                className="upload-modal-image"
              />
            )}

            <h3 className="upload-modal-section-title">🧂 재료</h3>
            <ul className="upload-modal-ingredients">
              {selectedRecipe.ingredients
                ?.split(/[,·\n;]+/)
                .map((i, idx) => (
                  <li key={idx} className="upload-modal-chip">
                    {i.trim()}
                  </li>
                ))}
            </ul>

            <h3 className="upload-modal-section-title">🍳 설명</h3>
            <div className="upload-modal-description">
              {selectedRecipe.description}
            </div>

            {selectedRecipe.baseRecipeName && (
              <>
                <h3 className="upload-modal-section-title">📖 참고 레시피</h3>
                <p className="upload-modal-reference">
                  {selectedRecipe.baseRecipeName}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
