import { useState, useEffect } from "react";
import axios from "axios";
import { getProfile } from "../api/api";
import "../styles/Community.css";

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editPost, setEditPost] = useState(null);
  const [showMyPosts, setShowMyPosts] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://210.110.33.220:8183/api";

  // ✅ 로그인 사용자 불러오기
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setCurrentUser(data);
      } catch (err) {
        console.error("로그인 사용자 정보 불러오기 실패:", err);
      }
    };
    fetchProfile();
  }, []);

  // ✅ 전체 게시글 불러오기 함수
  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/board`);
      setPosts(res.data);
    } catch (err) {
      console.error("게시글 불러오기 실패:", err);
    }
  };

  // ✅ 페이지 로드시 게시글 불러오기
  useEffect(() => {
    fetchPosts();
  }, []);

  // ✅ 글 등록
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return alert("제목과 내용을 입력하세요.");

    try {
      await axios.post(
        `${BASE_URL}/board`,
        { title, content },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      // ✅ 등록 완료 후 바로 목록 새로고침
      await fetchPosts();

      // ✅ 모달 닫기 + 입력 초기화
      setTitle("");
      setContent("");
      setModalOpen(false);

      alert("게시글이 등록되었습니다!");
    } catch (err) {
      console.error("게시글 등록 실패:", err);
      alert("게시글 등록 중 오류가 발생했습니다.");
    }
  };

  // ✅ 글 삭제
  const handleDelete = async (boardId, authorEmail) => {
    if (authorEmail !== currentUser?.email) {
      return alert("본인이 작성한 게시물만 삭제할 수 있습니다.");
    }
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await axios.delete(`${BASE_URL}/board/${boardId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      alert("삭제 완료!");
      await fetchPosts(); // ✅ 삭제 후 목록 갱신
    } catch (err) {
      console.error("게시글 삭제 실패:", err);
    }
  };

  // ✅ 글 수정 모달 열기
  const openEditModal = (post) => {
    if (post.user?.email !== currentUser?.email) {
      alert("본인이 작성한 게시물만 수정할 수 있습니다.");
      return;
    }
    setEditPost(post);
    setEditModalOpen(true);
  };

  // ✅ 글 수정 저장
  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${BASE_URL}/board/${editPost.boardId}`,
        {
          title: editPost.title,
          content: editPost.content,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      alert("수정 완료!");
      setEditModalOpen(false);
      await fetchPosts(); // ✅ 수정 후 목록 갱신
    } catch (err) {
      console.error("게시글 수정 실패:", err);
    }
  };

  // ✅ 내가 쓴 글만 보기
  const filteredPosts = showMyPosts
    ? posts.filter((p) => p.user?.email === currentUser?.email)
    : posts;

  return (
    <div className="community-page">
      <h1>자유게시판</h1>

      {showMyPosts && (
        <div className="my-posts-banner">
          ✏️ 내가 쓴 글 목록입니다.
          <button onClick={() => setShowMyPosts(false)}>전체 글 보기</button>
        </div>
      )}

      {/* ✅ 게시물 리스트 */}
      {filteredPosts.length === 0 ? (
        <div className="empty-bubble">💬 등록된 글이 없습니다</div>
      ) : (
        <div className="post-list">
          {filteredPosts.map((post) => (
            <div key={post.boardId} className="post">
              <div className="post-header">
                <h3>{post.title}</h3>
                {currentUser?.email === post.user?.email && (
                  <div className="post-actions">
                    <button
                      className="edit-btn"
                      onClick={() => openEditModal(post)}
                    >
                      ✏️
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(post.boardId, post.user?.email)}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
              <p className="post-content">{post.content}</p>
              <div className="post-info">
                <span className="post-author">
                  작성자: {post.user?.username} ({post.user?.email})
                </span>
                <span className="post-date">
                  {new Date(post.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✏️ 플로팅 버튼 */}
      <div className="floating-container">
        <button
          className="floating-btn"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ✏️
        </button>

        {menuOpen && (
          <div className="floating-menu">
            <button
              onClick={() => {
                setModalOpen(true);
                setMenuOpen(false);
              }}
            >
              글쓰기
            </button>
            <button
              onClick={() => {
                setShowMyPosts(true);
                setMenuOpen(false);
              }}
            >
              내가 쓴 글
            </button>
          </div>
        )}
      </div>

      {/* 📝 글쓰기 모달 */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>글쓰기</h2>
            <form onSubmit={handleSubmit} className="post-form">
              <input
                type="text"
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                placeholder="내용을 입력하세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <button type="submit">등록</button>
            </form>
          </div>
        </div>
      )}

      {/* ✏️ 수정 모달 */}
      {editModalOpen && (
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>게시물 수정</h2>
            <form onSubmit={handleEditSave} className="post-form">
              <input
                type="text"
                value={editPost.title}
                onChange={(e) =>
                  setEditPost({ ...editPost, title: e.target.value })
                }
              />
              <textarea
                value={editPost.content}
                onChange={(e) =>
                  setEditPost({ ...editPost, content: e.target.value })
                }
              />
              <button type="submit">수정 완료</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
