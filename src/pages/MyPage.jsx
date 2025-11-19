import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getProfile, updateProfile, logout } from "../api/api";
import "../styles/MyPage.css";

export default function MyPage() {
  const [profile, setProfile] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const BASE_URL = "http://210.110.33.220:8183/api";

  // ✅ 프로필 불러오기
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        setProfile(res.data);
        setFormData({
          username: res.data.username,
          email: res.data.email,
          password: "",
        });
      } catch (err) {
        console.error(err);
        alert("프로필을 불러오지 못했습니다.");
      }
    };
    fetchProfile();
  }, []);

  // ✅ 프로필 사진 변경
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  // ✅ 프로필 수정 완료
  const handleSaveChanges = async () => {
    try {
      await updateProfile(formData);
      alert("프로필이 수정되었습니다!");
      setEditModalOpen(false);
      setProfile({ ...profile, ...formData });
    } catch (err) {
      alert("수정 실패: " + (err.response?.data || err.message));
    }
  };

  // ✅ 로그아웃
  const handleLogout = async () => {
    await logout();
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    alert("로그아웃되었습니다.");
    window.location.href = "/login";
  };

  // ✅ 회원탈퇴
  const handleDeleteAccount = async () => {
    if (!window.confirm("정말 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.")) return;

    try {
      await axios.delete(`${BASE_URL}/delete`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      alert("회원탈퇴가 완료되었습니다.");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/signup";
    } catch (err) {
      console.error("회원탈퇴 실패:", err);
      alert("회원탈퇴 중 오류가 발생했습니다.");
    }
  };

  if (!profile)
    return <p style={{ textAlign: "center" }}>프로필 불러오는 중...</p>;

  return (
    <div className="mypage-container">
      {/* 상단 프로필 카드 */}
      <section className="profile-card">
        <div className="edit-top-right" onClick={() => setEditModalOpen(true)}>
          ✏️ <span>프로필 수정</span>
        </div>

        <div className="profile-left">
          <div
            className="profile-img-wrapper"
            onClick={() => setPhotoMenuOpen(!photoMenuOpen)}
          >
            <img
              src={preview || profile.profileImage || "/default.png"}
              alt="프로필"
              className="profile-img"
            />
          </div>

          {photoMenuOpen && (
            <div className="photo-menu">
              <button
                onClick={() =>
                  window.open(preview || profile.profileImage || "/default.png")
                }
              >
                사진 크게 보기
              </button>
              <button
                onClick={() => {
                  document.getElementById("profileImage").click();
                  setPhotoMenuOpen(false);
                }}
              >
                사진 수정
              </button>
            </div>
          )}

          <input
            id="profileImage"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
        </div>

        <div className="profile-right">
          <p>
            <b>이름:</b> {profile.username}
          </p>
          <p>
            <b>이메일:</b> {profile.email}
          </p>
        </div>
      </section>

      {/* ✅ 메뉴 네비게이션 */}
      <div className="menu-list">
        <button onClick={() => navigate("/my-posts")}>📜 내가 쓴 글</button>
        <button onClick={() => navigate("/my-comments")}>💬 내가 쓴 댓글</button>
        <button onClick={() => navigate("/recipe-upload")}>🍳 내가 쓴 레시피</button>
        <button onClick={() => navigate("/favorite")}>❤️ 내 즐겨찾기</button>
        <button onClick={() => navigate("/my-ratings")}>⭐ 내가 준 별점</button>
      </div>

      {/* 로그아웃 & 회원탈퇴 버튼 */}
      <div className="logout-section">
        <button onClick={handleLogout}>로그아웃</button>
        <button
          onClick={handleDeleteAccount}
          style={{
            marginTop: "10px",
            fontSize: "14px",
            color: "#ff4d4d",
            background: "none",
            border: "none",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          회원탈퇴
        </button>
      </div>

      {/* 수정 모달 */}
      {editModalOpen && (
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>프로필 수정</h3>
            <input
              type="text"
              placeholder="이름"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
            />
            <input
              type="email"
              placeholder="이메일"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            <input
              type="password"
              placeholder="비밀번호 변경 (선택)"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
            <button className="save-btn" onClick={handleSaveChanges}>
              수정 완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
