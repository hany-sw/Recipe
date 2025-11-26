import { useState, useEffect } from "react";
import axios from "axios";
import { getProfile } from "../api/api";

import "../styles/common.css";
import "../styles/Community.css";

export default function MyPosts() {
  const [myPosts, setMyPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const BASE_URL = "http://210.110.33.220:8183/api";

  // ✅ 로그인 사용자 정보 가져오기
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        setCurrentUser(res.data || res);
      } catch (err) {
        console.error("프로필 불러오기 실패:", err);
      }
    };
    fetchProfile();
  }, []);

  // ✅ 내가 쓴 글만 불러오기
  useEffect(() => {
    const fetchMyPosts = async () => {
      if (!currentUser?.username) return;

      try {
        const res = await axios.get(`${BASE_URL}/board`);

        // 🔥 백엔드가 반환하는 DTO는 user 없음 → username만 존재함
        const filtered = res.data.filter(
          (post) => post.username === currentUser.username
        );

        setMyPosts(filtered);
      } catch (err) {
        console.error("내 게시글 불러오기 실패:", err);
      }
    };

    fetchMyPosts();
  }, [currentUser]);

  return (
    <div className="page-container">
      {/* ⭐ 통일된 제목 */}
      <h2 className="page-title">
        <span className="page-title-icon">✏️</span>
        내가 쓴 글
      </h2>

      {myPosts.length === 0 ? (
        <p className="empty">작성한 게시물이 없습니다</p>
      ) : (
        <div className="post-list">
          {myPosts.map((post) => (
            <div key={post.boardId} className="post">
              <div className="post-header">
                <h3>{post.title}</h3>
              </div>

              <p className="post-content">{post.content}</p>

              <div className="post-info">
                <span>작성자: {post.username}</span>
                <span>{new Date(post.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
