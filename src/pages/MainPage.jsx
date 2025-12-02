import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, logout } from "../api/api";
import Top10List from "../components/Top10List";
import AiModeModal from "../components/AiModeModal";
import "../styles/MainPage.css";

export default function MainPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [query, setQuery] = useState("");
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const navigate = useNavigate();

  // 프로필
  useEffect(() => {
    (async () => {
      try {
        const res = await getProfile();
        setUserName(res.data?.username ?? "");
      } catch {
        setUserName("");
      }
    })();
  }, []);

  // 로그아웃
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUserName("");
      alert("로그아웃되었습니다.");
      navigate("/login", { replace: true });
      window.location.reload();
    } catch (err) {
      alert(err.response?.data || err.message);
    }
  }, [navigate]);

  // 검색
  const handleSearch = useCallback(() => {
    if (!query.trim()) {
      alert("재료를 입력해주세요!");
      return;
    }
    navigate(`/search?ingredient=${encodeURIComponent(query)}`);
  }, [navigate, query]);

  // 모달 닫기 콜백 (메모이즈)
  const closeAiModal = useCallback(() => setAiModalOpen(false), []);

  // 모달 초기값(안정된 ref 제공을 위해 useMemo)
  const aiInitial = useMemo(
    () => ({
      foodPreference: "",
      allergies: [],
      difficulty: "",
      mealTime: "",
      weather: "",
      ingredients: "",
    }),
    []
  );

  return (
    <div className="main-page">
      <header className="app-header">

  {/* 중앙 제목 */}
  <h1 className="header-title" onClick={() => navigate("/")}>
    🍳 냉장고 레시피
  </h1>

  {/* 메뉴 버튼 */}
  <div className="menu-icon" onClick={() => setMenuOpen((v) => !v)}>
    ☰
  </div>

  {/* 기존 드롭다운 메뉴 그대로 유지 */}
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
        <div className="search-section">
          <p className="search-guide">냉장고에 있는 재료를 입력하세요 🥕</p>
          <div className="search-box">
            <input
              type="text"
              placeholder="예: 달걀, 양파, 토마토"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button onClick={handleSearch}>검색</button>
          </div>

          {/* AI 모드 버튼 */}
          <div className="ai-mode-container">
            <button className="ai-mode-btn" onClick={() => setAiModalOpen(true)}>
              🤖 AI 모드
            </button>
          </div>
        </div>

        <div className="top10-box">
          <h2>🔥 인기 레시피 TOP 10</h2>
          <Top10List />
        </div>
      </main>

      {/* 🔧 핵심: 항상 렌더하고 open prop으로만 토글 */}
      <AiModeModal
        key={aiModalOpen ? "ai-open" : "ai-closed"}  // HMR/상태 꼬임 방지
        open={aiModalOpen}
        onClose={closeAiModal}
        initial={aiInitial}
      />
    </div>
  );
}
