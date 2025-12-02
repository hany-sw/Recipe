// src/pages/PostDetail.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { getProfile } from "../api/api";
import "../styles/PostDetail.css";

export default function PostDetail({ post, onClose }) {
  const BASE_URL = "http://210.110.33.220:8183/api";

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  /* ------------------- 로그인 유저 정보 ------------------- */
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await getProfile();
        setCurrentUser(res.data || res);
      } catch (err) {
        console.error("유저 정보 불러오기 실패:", err);
      }
    };
    loadUser();
  }, []);

  /* ------------------- 댓글 불러오기 ------------------- */
  const fetchComments = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/comment/${post.boardId}`);
      setComments(res.data || []);
    } catch (err) {
      console.error("댓글 불러오기 실패:", err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [post.boardId]);

  /* ------------------- 일반 댓글 작성 ------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await axios.post(
        `${BASE_URL}/comment/${post.boardId}`,
        { content: newComment, parentId: null },
        { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
      );

      setNewComment("");
      fetchComments();
    } catch (err) {
      console.error("댓글 작성 실패:", err);
    }
  };

  /* ------------------- 답글 작성 ------------------- */
  const handleReplySubmit = async (e, parentId) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      await axios.post(
        `${BASE_URL}/comment/${post.boardId}`,
        { content: replyContent, parentId },
        { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
      );

      setReplyTarget(null);
      setReplyContent("");
      fetchComments();
    } catch (err) {
      console.error("답글 작성 실패:", err);
    }
  };

  /* ------------------- 댓글 삭제 ------------------- */
  const deleteComment = async (commentId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await axios.delete(`${BASE_URL}/comment/${commentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });

      fetchComments();
    } catch (err) {
      console.error("댓글 삭제 실패:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  /* ------------------- 날짜 / 작성자 안전 처리 ------------------- */
  const safeUsername = post.username || "알 수 없음";
  const safeDate = post.createdAt
    ? new Date(post.createdAt).toLocaleString()
    : "날짜 없음";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✖</button>

        <h2>{post.title}</h2>
        <p className="author">
          {safeUsername} · {safeDate}
        </p>

        <p className="content">{post.content}</p>
        <hr />

        {/* ------------------- 댓글 목록 ------------------- */}
        <h3>💬 댓글</h3>

        <div className="comment-list">
          {comments.length > 0 ? (
            comments.map((c) => (
              <div key={c.commentId} className="comment">
                
                <div className="comment-header">
                  <strong>{c.username}</strong>
                  <span>{new Date(c.createdAt).toLocaleString()}</span>
                </div>

                <p className="comment-content">{c.content}</p>

                <div className="comment-actions">
                  <button onClick={() => setReplyTarget(c.commentId)}>답글</button>

                  {/* 🔥 본인 댓글일 경우만 삭제 버튼 표시 */}
                  {currentUser?.username === c.username && (
                    <button
                      className="comment-delete-btn"
                      onClick={() => deleteComment(c.commentId)}
                    >
                      삭제
                    </button>
                  )}
                </div>

                {/* 답글 입력창 */}
                {replyTarget === c.commentId && (
                  <form
                    className="reply-form"
                    onSubmit={(e) => handleReplySubmit(e, c.commentId)}
                  >
                    <input
                      type="text"
                      placeholder="답글을 입력하세요..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                    />
                    <button type="submit">등록</button>
                  </form>
                )}

                {/* 대댓글 렌더링 */}
                {c.replies?.length > 0 &&
                  c.replies.map((r) => (
                    <div key={r.commentId} className="reply">
                      <div className="reply-header">
                        <strong>{r.username}</strong>
                        <span>{new Date(r.createdAt).toLocaleString()}</span>
                      </div>

                      <p>{r.content}</p>

                      <div className="comment-actions">
                        <button onClick={() => setReplyTarget(r.commentId)}>답글</button>

                        {/* 🔥 본인 대댓글일 경우만 삭제 버튼 */}
                        {currentUser?.username === r.username && (
                          <button
                            className="comment-delete-btn"
                            onClick={() => deleteComment(r.commentId)}
                          >
                            삭제
                          </button>
                        )}
                      </div>

                      {/* 대댓글에 다시 답글 */}
                      {replyTarget === r.commentId && (
                        <form
                          className="reply-form"
                          onSubmit={(e) => handleReplySubmit(e, r.commentId)}
                        >
                          <input
                            type="text"
                            placeholder="답글을 입력하세요..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                          />
                          <button type="submit">등록</button>
                        </form>
                      )}
                    </div>
                  ))}
              </div>
            ))
          ) : (
            <p className="no-comment">아직 댓글이 없습니다.</p>
          )}
        </div>

        {/* ------------------- 일반 댓글 작성 ------------------- */}
        <form className="comment-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="댓글을 입력하세요..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button type="submit">등록</button>
        </form>
      </div>
    </div>
  );
}
