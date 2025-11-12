import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import "../styles/Header.css";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  if (location.pathname === "/") return null; // 메인에서는 헤더 숨김

  const toggleMenu = () => setMenuOpen(!menuOpen);

  // ✅ 페이지 이동 시 자동으로 메뉴 닫기
  const handleNavigate = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  // ✅ 로그아웃 기능
  const handleLogout = () => {
    if (window.confirm("정말 로그아웃 하시겠습니까?")) {
      // 1️⃣ 토큰 삭제
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user"); // 혹시 사용자 정보 저장했으면 같이 삭제

      // 2️⃣ 알림
      alert("로그아웃 되었습니다.");

      // 3️⃣ 메뉴 닫기 및 메인으로 이동
      setMenuOpen(false);
      navigate("/");
    }
  };

  return (
    <>
      <header className="app-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ⬅
        </button>

        <h1 className="header-title" onClick={() => handleNavigate("/")}>
          🍳 냉장고 레시피
        </h1>

        <button className="menu-btn" onClick={toggleMenu}>
          ☰
        </button>

        {menuOpen && (
          <div className="menu-dropdown">
            <button onClick={() => handleNavigate("/mypage")}>마이페이지</button>
            <button onClick={() => handleNavigate("/recipe-upload")}>레시피 등록</button>
            <button onClick={() => handleNavigate("/favorite")}>즐겨찾기</button>
            <button onClick={() => handleNavigate("/community")}>자유게시판</button>

            {/* ✅ 실제 로그아웃 기능 적용 */}
            <button onClick={handleLogout}>🚪 로그아웃</button>
          </div>
        )}
      </header>

      {/* 본문이 헤더에 가려지지 않도록 간격 확보 */}
      <div className="header-spacing"></div>
    </>
  );
}
