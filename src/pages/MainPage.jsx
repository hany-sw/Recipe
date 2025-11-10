import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, logout } from "../api/api"; // ✅ API 연결
import Top10List from "../components/Top10List";
import "../styles/MainPage.css";


export default function MainPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  // ✅ 로그인 상태 확인 & 프로필 불러오기
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile(); // 백엔드에서 유저 정보 불러오기
        setUserName(res.data.username); // username 필드 기준
      } catch (err) {
        // 로그인이 안 되어 있거나 토큰 만료
        console.error("프로필 불러오기 실패:", err);
        setUserName("");
      }
    };
    fetchProfile();
  }, []);

  // ✅ 로그아웃
  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUserName("");
      alert("로그아웃되었습니다.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data || err.message);
    }
  };

  // ✅ 검색
  const handleSearch = () => {
    if (query.trim() === "") {
      alert("재료를 입력해주세요!");
      return;
    }
    navigate(`/search?ingredient=${encodeURIComponent(query)}`);
  };

  return (
    <div className="main-page">
      <header className="site-header">
        <h1 className="logo">🍳 냉장고 레시피</h1>
        <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </div>

        {/* ✅ 메뉴 열기 */}
        {menuOpen && (
          <div className="dropdown-menu">
            {userName ? (
              <>
                <p>{userName}님</p>
                <hr />
                <button onClick={() => navigate("/mypage")}>마이페이지</button>
                <button onClick={() => navigate("/recipe-upload")}>레시피 등록</button>
                <button onClick={() => navigate("/favorite")}>즐겨찾기</button>
                <button onClick={() => navigate("/community")}>자유게시판</button>
                <hr />
                <button onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <button onClick={() => navigate("/login")}>Login</button>
                <button onClick={() => navigate("/signup")}>Signup</button>
              </>
            )}
          </div>
        )}
      </header>

      <main className="main-content">
        {/* ✅ 검색 섹션 */}
        <div className="search-section">
          <p className="search-guide">냉장고에 있는 재료를 입력하세요 🥕</p>
          <div className="search-box">
            <input
              type="text"
              placeholder="예: 달걀, 양파, 토마토"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
            <button onClick={handleSearch}>검색</button>
          </div>
        </div>

        {/* ✅ 인기 레시피 */}
        <div className="top10-box">
          <h2>🔥 인기 레시피 TOP 10</h2>
          <Top10List />
        </div>
      </main>
    </div>
  );
}
