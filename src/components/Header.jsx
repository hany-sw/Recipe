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
            <button onClick={() => {
              alert("로그아웃 기능은 준비 중입니다.");
              setMenuOpen(false); // ✅ 로그아웃 클릭 후 메뉴 닫기
            }}>
              🚪 로그아웃
            </button>
          </div>
        )}
      </header>

      {/* 본문이 헤더에 가려지지 않도록 간격 확보 */}
      <div className="header-spacing"></div>
    </>
  );
}
