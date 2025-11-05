import { useState, useEffect } from "react";
import { getProfile } from "../api/api";
import "../styles/RecipeUpload.css";

export default function RecipeUpload() {
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [recipe, setRecipe] = useState({
    title: "",
    ingredients: "",
    steps: "",
    image: null,
  });
  const [preview, setPreview] = useState(null);
  const [myRecipes, setMyRecipes] = useState([]);

  // ✅ 로그인 사용자 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getProfile();
        setUser(data);
      } catch {
        alert("로그인 후 이용해주세요!");
        window.location.href = "/login";
      }
    };
    fetchUser();
  }, []);

  // ✅ 사용자 본인 레시피 로드
  const loadUserRecipes = () => {
    const all = JSON.parse(localStorage.getItem("customRecipes")) || [];
    const filtered = all.filter((r) => r.authorEmail === user?.email);
    setMyRecipes(filtered);
  };

  useEffect(() => {
    if (user) loadUserRecipes();
  }, [user]);

  // ✅ 이미지 미리보기
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRecipe({ ...recipe, image: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  // ✅ 등록 or 수정
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!recipe.title || !recipe.ingredients || !recipe.steps) {
      alert("모든 항목을 입력해주세요!");
      return;
    }

    const allRecipes = JSON.parse(localStorage.getItem("customRecipes")) || [];

    if (isEditMode) {
      // 수정 모드
      const updated = allRecipes.map((r) =>
        r.id === editingId
          ? {
              ...r,
              title: recipe.title,
              ingredients: recipe.ingredients,
              steps: recipe.steps,
              image: preview || r.image,
            }
          : r
      );
      localStorage.setItem("customRecipes", JSON.stringify(updated));
      alert("레시피가 수정되었습니다!");
    } else {
      // 등록 모드
      const newRecipe = {
        id: Date.now(),
        title: recipe.title,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        image: preview,
        author: user.username,
        authorEmail: user.email,
        createdAt: new Date().toLocaleString(),
      };
      const updated = [newRecipe, ...allRecipes];
      localStorage.setItem("customRecipes", JSON.stringify(updated));
      alert("레시피가 등록되었습니다!");
    }

    loadUserRecipes();
    resetForm();
  };

  // ✅ 수정 버튼 클릭 시 데이터 불러오기
  const handleEdit = (recipe) => {
    setIsModalOpen(true);
    setIsEditMode(true);
    setEditingId(recipe.id);
    setRecipe({
      title: recipe.title,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      image: recipe.image,
    });
    setPreview(recipe.image);
  };

  // ✅ 삭제
  const handleDelete = (id) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      const all = JSON.parse(localStorage.getItem("customRecipes")) || [];
      const updated = all.filter((r) => r.id !== id);
      localStorage.setItem("customRecipes", JSON.stringify(updated));
      loadUserRecipes();
    }
  };

  // ✅ 모달 닫기 시 초기화
  const resetForm = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingId(null);
    setRecipe({ title: "", ingredients: "", steps: "", image: null });
    setPreview(null);
  };

  return (
    <div className="upload-page">
      <h1>내 레시피 관리</h1>

      {/* 플로팅 버튼 */}
      <button className="add-btn" onClick={() => setIsModalOpen(true)}>
        ✏️
      </button>

      {/* 🧾 등록/수정 모달 */}
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
                placeholder="예: 간장계란밥"
                value={recipe.title}
                onChange={(e) => setRecipe({ ...recipe, title: e.target.value })}
              />

              <label>재료</label>
              <textarea
                placeholder="예: 계란 2개, 간장 1스푼, 밥 한 공기"
                value={recipe.ingredients}
                onChange={(e) =>
                  setRecipe({ ...recipe, ingredients: e.target.value })
                }
              />

              <label>만드는 방법</label>
              <textarea
                placeholder="예: 1. 계란을 풀고 간장 넣기..."
                value={recipe.steps}
                onChange={(e) =>
                  setRecipe({ ...recipe, steps: e.target.value })
                }
              />

              <label>이미지 업로드</label>
              <input type="file" accept="image/*" onChange={handleImageChange} />

              {preview && (
                <div className="preview">
                  <img src={preview} alt="레시피 미리보기" />
                </div>
              )}

              <button type="submit" className="submit-btn">
                {isEditMode ? "수정하기" : "등록하기"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ✅ 등록된 레시피 목록 */}
      <div className="my-recipe-list">
        {myRecipes.length === 0 ? (
          <p className="empty">등록한 레시피가 없습니다</p>
        ) : (
          <div className="recipe-grid">
            {myRecipes.map((r) => (
              <div key={r.id} className="recipe-card">
                <img src={r.image} alt={r.title} />
                <h3>{r.title}</h3>
                <p className="author">📅 {r.createdAt}</p>
                <div className="edit-btns">
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(r)}
                  >
                    ✏️ 수정
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(r.id)}
                  >
                    🗑️ 삭제
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
