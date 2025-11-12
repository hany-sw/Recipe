import { useState, useEffect } from "react";
import { getProfile } from "../api/api";
import instance from "../api/api"; 
import "../styles/RecipeUpload.css";

export default function RecipeUpload() {
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [recipe, setRecipe] = useState({
    name: "",
    description: "",
    imageUrl: "",
    ingredients: "",
    baseRecipeName: "",
  });
  const [myRecipes, setMyRecipes] = useState([]);

  // ✅ 로그인 사용자 불러오기
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

  // ✅ 내 레시피 불러오기
  const loadUserRecipes = async () => {
    if (!user) return;
    try {
      const res = await instance.get(`/recipes/my`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setMyRecipes(res.data);
    } catch (err) {
      console.error("레시피 불러오기 실패:", err);
    }
  };

  useEffect(() => {
    if (user) loadUserRecipes();
  }, [user]);

  // ✅ 레시피 등록 / 수정
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
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        alert("레시피가 수정되었습니다!");
      } else {
        // ✅ 변경된 백엔드 경로에 맞춰 수정
        await instance.post(`/recipes/user`, payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        alert("레시피가 등록되었습니다!");
      }

      loadUserRecipes();
      resetForm();
    } catch (err) {
      console.error("레시피 등록/수정 실패:", err);
      alert("⚠️ 서버 오류: 레시피를 처리할 수 없습니다.");
    }
  };

  // ✅ 수정
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

  // ✅ 삭제
  const handleDelete = async (id) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      try {
        await instance.delete(`/recipes/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        alert("삭제되었습니다!");
        loadUserRecipes();
      } catch (err) {
        console.error("삭제 실패:", err);
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  // ✅ 폼 리셋
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

  return (
    <div className="upload-page">
      <h1>나만의 레시피 관리</h1>

      {/* 플로팅 버튼 */}
      <button className="add-btn" onClick={() => setIsModalOpen(true)}>
        ✏️
      </button>

      {/* 등록 / 수정 모달 */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={resetForm}>
              ✖
            </button>
            <h2>{isEditMode ? "레시피 수정" : "나만의 레시피 등록"}</h2>

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
                onChange={(e) =>
                  setRecipe({ ...recipe, imageUrl: e.target.value })
                }
              />

              <label>재료 (선택)</label>
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

      {/* 등록된 레시피 목록 */}
      <div className="my-recipe-list">
        {myRecipes.length === 0 ? (
          <p className="empty">등록된 레시피가 없습니다</p>
        ) : (
          <div className="recipe-grid">
            {myRecipes.map((r) => (
              <div key={r.userRecipeId} className="recipe-card">
                {r.imageUrl && <img src={r.imageUrl} alt={r.name} />}
                <h3>{r.name}</h3>
                <p>{r.description.slice(0, 50)}...</p>
                <div className="edit-btns">
                  <button className="edit-btn" onClick={() => handleEdit(r)}>
                    ✏️ 수정
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(r.userRecipeId)}
                  >
                    🗑 삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
