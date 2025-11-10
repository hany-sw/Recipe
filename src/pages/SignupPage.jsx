import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup } from "../api/api";
import "../styles/SignupPage.css";


export default function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.email || !formData.password) {
      alert("모든 항목을 입력해주세요.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      // ✅ 파라미터 순서 수정
      await signup(formData.email, formData.username, formData.password, formData.confirmPassword);
      alert("회원가입이 완료되었습니다!");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="signup-page">
      <header className="signup-header"><h1>회원가입</h1></header>

      <form className="signup-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="이름"
          value={formData.username}
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="EMAIL"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="PW"
          value={formData.password}
          onChange={handleChange}
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="PW 확인"
          value={formData.confirmPassword}
          onChange={handleChange}
        />
        <button type="submit" className="signup-btn">
          회원가입
        </button>
      </form>

      <p className="to-login">
        이미 계정이 있으신가요?{" "}
        <span onClick={() => navigate("/login")}>로그인하기</span>
      </p>
    </div>
  );
}
