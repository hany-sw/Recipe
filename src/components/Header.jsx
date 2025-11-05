import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import "../styles/Header.css";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  if (location.pathname === "/") return null; // 메인에서는 헤더 숨김

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <>
      <header className="app-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ⬅
        </button>

        <h1 className="header-title" onClick={() => navigate("/")}>
          🍳 냉장고 레시피
        </h1>

        <button className="menu-btn" onClick={toggleMenu}>
          ☰
        </button>

        {menuOpen && (
          <div className="menu-dropdown">
            <button onClick={() => navigate("/mypage")}>마이페이지</button>
                <button onClick={() => navigate("/recipe-upload")}>레시피 등록</button>
                <button onClick={() => navigate("/favorite")}>즐겨찾기</button>
                <button onClick={() => navigate("/community")}>자유게시판</button>
          <button onClick={() => alert("로그아웃 기능은 준비 중입니다.")}>
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
