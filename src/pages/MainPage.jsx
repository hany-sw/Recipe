import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, logout } from "../api/api";
import {
  aiStart,
  aiSetAllergy,
  aiSetDifficulty,
  aiSetIngredientsAndRecommend,
} from "../api/api";
import Top10List from "../components/Top10List";
import AiModeModal from "../components/AiModeModal";
import "../styles/MainPage.css";

export default function MainPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [query, setQuery] = useState("");
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await getProfile();
        setUserName(res.data.username);
      } catch {
        setUserName("");
      }
    })();
  }, []);

  const handleLogout = async () => {
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
  };

  const handleSearch = () => {
    if (!query.trim()) {
      alert("재료를 입력해주세요!");
      return;
    }
    navigate(`/search?ingredient=${encodeURIComponent(query)}`);
  };

  // ✅ AI 모달 확인 → 단계형 호출
  const handleConfirmAI = async (prefs) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }
    try {
      // 1) 세션 시작 (백엔드가 body를 받아도 되고 무시해도 OK)
      const startRes = await aiStart({
        foodPreference: (prefs.cuisines || []).join(","),
        allergy: (prefs.allergies || []).join(","),
        difficulty: prefs.difficulty || "",
        mealTime: prefs.mealTime || "",
        weather: prefs.weather || "",
        ingredients: prefs.ingredients || "",
      });
      const sessionId = startRes.data?.sessionId;
      if (!sessionId) throw new Error("세션 생성 실패");

      // 2) (옵션) 알러지 여러 개면 여러 번 등록
      for (const a of prefs.allergies || []) {
        await aiSetAllergy(sessionId, a);
      }
      // 3) (옵션) 난이도
      if (prefs.difficulty) {
        await aiSetDifficulty(sessionId, prefs.difficulty);
      }
      // 4) 재료 입력 → 추천 응답 받기
      if (!prefs.ingredients?.trim()) {
        alert("재료를 입력해주세요!");
        return;
      }
      const recRes = await aiSetIngredientsAndRecommend(sessionId, prefs.ingredients);
      const recommendation = recRes.data || {}; // RecipeRecommendationResponse

      // 5) 결과 페이지 이동
      navigate("/ai-results", {
        state: {
          sessionId,
          options: prefs,
          recommendation, // titles/리스트 등이 들어있을 것
        },
      });
      setAiModalOpen(false);
    } catch (e) {
      console.error(e);
      alert(e.response?.data || e.message || "AI 추천 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="main-page">
      <header className="site-header">
        <h1 className="logo">🍳 냉장고 레시피</h1>
        <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>☰</div>

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
        {/* 검색 */}
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

        {/* 인기 레시피 */}
        <div className="top10-box">
          <h2>🔥 인기 레시피 TOP 10</h2>
          <Top10List />
        </div>
      </main>

      {/* AI 모달 */}
      <AiModeModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onConfirm={handleConfirmAI}
      />
    </div>
  );
}
