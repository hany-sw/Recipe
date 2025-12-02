import { useState, useEffect } from "react";
import axios from "axios";
import { getProfile } from "../api/api";
import PostDetail from "./PostDetail";

import "../styles/common.css";
import "../styles/Community.css";

export default function MyPosts() {
  const [myPosts, setMyPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  const BASE_URL = "http://210.110.33.220:8183/api";

  // 로그인 사용자 정보
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

  // 내가 쓴 글 불러오기
  useEffect(() => {
    const fetchMyPosts = async () => {
      if (!currentUser?.username) return;

      try {
        const res = await axios.get(`${BASE_URL}/board`);

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
      <h2 className="page-title">
        <span className="page-title-icon">✏️</span>
        내가 쓴 글
      </h2>

      {myPosts.length === 0 ? (
        <p className="empty-bubble">작성한 게시물이 없습니다</p>
      ) : (
        <div className="post-list">
          {myPosts.map((post) => (
            <div
              key={post.boardId}
              className="post"
              onClick={() => setSelectedPost(post)}
            >
              {/* 왼쪽 아이콘 (레시피 카드 디자인 동일 적용) */}
              <div className="post-icon-wrap">📝</div>

              {/* 내용 */}
              <div className="post-body">
                <div className="post-title">{post.title}</div>

                <div className="post-content-preview">{post.content}</div>

                <div className="post-info">
                  <span>작성자: {post.username}</span>
                  <span>{new Date(post.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 상세보기 모달 */}
      {selectedPost && (
        <PostDetail post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}
