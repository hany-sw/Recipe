// src/pages/MyComments.jsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { getProfile } from "../api/api";
import PostDetail from "./PostDetail";

import "../styles/common.css";
import "../styles/Community.css";
import "../styles/PostDetail.css";

export default function MyComments() {
  const [currentUser, setCurrentUser] = useState(null);
  const [allComments, setAllComments] = useState([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedPost, setSelectedPost] = useState(null);

  const loaderRef = useRef(null);
  const BASE_URL = "http://210.110.33.220:8183/api";

  /* ----------------------------------------------
     🔹 로그인 정보 가져오기
  ------------------------------------------------ */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getProfile();
        setCurrentUser(res.data || res);
      } catch (err) {
        console.error("사용자 정보 불러오기 실패:", err);
      }
    };
    fetchUser();
  }, []);

  /* ----------------------------------------------
     🔹 댓글 + 대댓글을 모두 flatten 하여 내 댓글 추출
  ------------------------------------------------ */
  const extractMyComments = (comments, post) => {
    let result = [];

    const dfs = (c) => {
      if (c.username === currentUser?.username) {
        result.push({
          ...c,
          postTitle: post.title,
          postId: post.boardId,
        });
      }
      if (c.replies && c.replies.length > 0) {
        c.replies.forEach((r) => dfs(r));
      }
    };

    comments.forEach((c) => dfs(c));
    return result;
  };

  /* ----------------------------------------------
     🔹 모든 게시글에서 내 댓글 가져오기
  ------------------------------------------------ */
  useEffect(() => {
    if (!currentUser) return;

    const fetchMyComments = async () => {
      try {
        const resBoards = await axios.get(`${BASE_URL}/board`);
        const boards = resBoards.data;

        let list = [];

        for (const post of boards) {
          const resComments = await axios.get(
            `${BASE_URL}/comment/${post.boardId}`
          );

          const myList = extractMyComments(resComments.data || [], post);
          list.push(...myList);
        }

        // 최신순 정렬
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setAllComments(list);
      } catch (err) {
        console.error("댓글 로딩 실패:", err);
      }
    };

    fetchMyComments();
  }, [currentUser]);

  /* ----------------------------------------------
     🔹 무한스크롤
  ------------------------------------------------ */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 20);
        }
      },
      { threshold: 1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, []);

  const visibleComments = allComments.slice(0, visibleCount);

  /* ----------------------------------------------
     🔹 게시글 상세보기 (중요: 전체 게시글 정보 다시 가져오기)
  ------------------------------------------------ */
  const openPostDetail = async (comment) => {
    try {
      const res = await axios.get(`${BASE_URL}/board/${comment.postId}`);
      setSelectedPost(res.data); // 전체 게시글 데이터 전달
    } catch (err) {
      console.error("게시글 상세조회 실패:", err);
    }
  };

  return (
    <div className="page-container">
      <h2 className="page-title">
        <span className="page-title-icon">💬</span> 내가 쓴 댓글
      </h2>

      {visibleComments.length === 0 ? (
        <p className="empty">작성한 댓글이 없습니다</p>
      ) : (
        <div className="post-list">
          {visibleComments.map((c) => (
            <div
              key={c.commentId}
              className="post"
              onClick={() => openPostDetail(c)}
            >
              <div className="post-icon-wrap">💬</div>

              <div className="post-body">
                <div className="post-title">
                  {c.postTitle} <span style={{ fontSize: "18px" }}>💬</span>
                </div>

                <div className="post-content-preview">💬 {c.content}</div>

                <div className="post-info">
                  <span>
                    {c.createdAt
                      ? new Date(c.createdAt).toLocaleString()
                      : "시간 정보 없음"}
                  </span>
                </div>
              </div>
            </div>
          ))}

          <div ref={loaderRef} style={{ height: "30px" }}></div>
        </div>
      )}

      {/* 상세보기 모달 */}
      {selectedPost && (
        <PostDetail post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}
