import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/PostDetail.css";

export default function PostDetail({ post, onClose }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const BASE_URL = "http://210.110.33.220:8183/api";

  const fetchComments = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/board/${post.boardId}/comments`);
      setComments(res.data || []);
    } catch (err) {
      console.error("댓글 불러오기 실패:", err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [post.boardId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await axios.post(
        `${BASE_URL}/board/${post.boardId}/comments`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
      );
      setNewComment("");
      fetchComments();
    } catch (err) {
      console.error("댓글 작성 실패:", err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✖</button>
        <h2>{post.title}</h2>
        <p className="author">{post.user?.username || "익명"} · {new Date(post.createdAt).toLocaleString()}</p>
        <p className="content">{post.content}</p>
        <hr />

        <h3>💬 댓글</h3>
        <div className="comment-list">
          {comments.length > 0 ? (
            comments.map((c) => (
              <div key={c.commentId} className="comment">
                <strong>{c.user?.username || "익명"}</strong>
                <p>{c.content}</p>
                <span>{new Date(c.createdAt).toLocaleString()}</span>
              </div>
            ))
          ) : (
            <p className="no-comment">아직 댓글이 없습니다.</p>
          )}
        </div>

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
