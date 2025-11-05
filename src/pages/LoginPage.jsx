import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, getProfile } from "../api/api"; // ✅ getProfile 추가
import "../styles/LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    try {
      // ✅ 백엔드 로그인 요청 (토큰 저장됨)
      await login(email, password);

      // ✅ 로그인 후 프로필 불러오기
      const profile = await getProfile();
      localStorage.setItem("userName", profile.username); // 이름 저장
      localStorage.setItem("isLoggedIn", "true");

      alert(`${profile.username}님 환영합니다!`);
      navigate("/"); // ✅ 메인 페이지로 이동
    } catch (err) {
      alert(err.response?.data?.message || "로그인 실패. 다시 시도해주세요.");
    }
  };

  return (
    <div className="login-page">
      <h2>로그인</h2>

      <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>로그인</button>
      <button className="signup-btn" onClick={() => navigate("/signup")}>
        회원가입
      </button>
    </div>
  );
}
