import { useState, useEffect } from "react";
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
  const [showMyPosts, setShowMyPosts] = useState(false); // ✅ 내가 쓴 글 보기 상태

  // ✅ 로그인 사용자 정보 불러오기
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

  // ✅ 글 등록
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newPost = {
      id: Date.now(),
      title,
      content,
      authorName: currentUser?.username || "익명",
      authorEmail: currentUser?.email || "unknown",
      createdAt: new Date().toLocaleString(),
    };

    setPosts([newPost, ...posts]);
    setTitle("");
    setContent("");
    setModalOpen(false);
  };

  // ✅ 글 삭제
  const handleDelete = (id, authorEmail) => {
    if (authorEmail !== currentUser?.email) {
      alert("본인이 작성한 게시물만 삭제할 수 있습니다.");
      return;
    }
    if (window.confirm("정말 이 게시물을 삭제하시겠습니까?")) {
      setPosts(posts.filter((post) => post.id !== id));
    }
  };

  // ✅ 글 수정
  const openEditModal = (post) => {
    if (post.authorEmail !== currentUser?.email) {
      alert("본인이 작성한 게시물만 수정할 수 있습니다.");
      return;
    }
    setEditPost(post);
    setEditModalOpen(true);
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    setPosts(
      posts.map((p) =>
        p.id === editPost.id
          ? { ...p, title: editPost.title, content: editPost.content }
          : p
      )
    );
    setEditModalOpen(false);
  };

  // ✅ 내가 쓴 글만 필터링
  const filteredPosts = showMyPosts
    ? posts.filter((post) => post.authorEmail === currentUser?.email)
    : posts;

  return (
    <div className="community-page">
      <h1>자유게시판</h1>

      {/* 내가 쓴 글 보기 모드 */}
      {showMyPosts && (
        <div className="my-posts-banner">
          ✏️ 내가 쓴 글 목록입니다.
          <button onClick={() => setShowMyPosts(false)}>전체 글 보기</button>
        </div>
      )}

      {/* 게시물 리스트 */}
      {filteredPosts.length === 0 ? (
        <div className="empty-bubble">💬 등록된 글이 없습니다</div>
      ) : (
        <div className="post-list">
          {filteredPosts.map((post) => (
            <div key={post.id} className="post">
              <div className="post-header">
                <h3>{post.title}</h3>
                {currentUser?.email === post.authorEmail && (
                  <div className="post-actions">
                    <button
                      className="edit-btn"
                      onClick={() => openEditModal(post)}
                    >
                      ✏️
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() =>
                        handleDelete(post.id, post.authorEmail)
                      }
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
              <p className="post-content">{post.content}</p>
              <div className="post-info">
                <span className="post-author">
                  작성자: {post.authorName} ({post.authorEmail})
                </span>
                <span className="post-date">{post.createdAt}</span>
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
