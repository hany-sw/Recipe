// src/components/Top10List.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BASE_URL = "http://localhost:8183/api";

export default function Top10List() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchTop10 = async () => {
      try {
        // 1) 평점 TOP10(아이디, 평균점수만 옴)
        const { data: top } = await axios.get(`${BASE_URL}/rating/top10`);
        const topList = Array.isArray(top) ? top : [];

        // 2) 각 레시피 상세 조회로 제목/이미지 확보
        const details = await Promise.all(
          topList.map(async (t, idx) => {
            try {
              const { data: d } = await axios.get(`${BASE_URL}/recipes/${t.recipeId}`);

              // 백엔드 응답 케이스 방어
              const title =
                d.title || d.name || d.RCP_NM || `레시피 ${t.recipeId}`;
              const imageUrl =
                d.imageUrl || d.ATT_FILE_NO_MAIN || "/no-image.png";
              const ingredients = d.ingredients || d.RCP_PARTS_DTLS || "";
              const description =
                d.description || d.RCP_WAY2 || d.manual || "";

              return {
                rank: idx + 1,
                recipeId: t.recipeId,
                avg: typeof t.averageRating === "number" ? t.averageRating : 0,
                title,
                imageUrl,
                // 상세 페이지로 그대로 넘길 원본 필드
                recipeForDetail: { title, imageUrl, ingredients, description },
              };
            } catch {
              return {
                rank: idx + 1,
                recipeId: t.recipeId,
                avg: typeof t.averageRating === "number" ? t.averageRating : 0,
                title: `레시피 ${t.recipeId}`,
                imageUrl: "/no-image.png",
                recipeForDetail: {
                  title: `레시피 ${t.recipeId}`,
                  imageUrl: "/no-image.png",
                  ingredients: "",
                  description: "",
                },
              };
            }
          })
        );

        if (isMounted) setItems(details);
      } catch (e) {
        console.error("TOP10 불러오기 실패:", e);
        if (isMounted) setItems([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTop10();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <div style={{ padding: 12 }}>불러오는 중...</div>;
  }

  if (items.length === 0) {
    return <div style={{ padding: 12 }}>인기 레시피가 없습니다.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((it) => (
        <div
          key={it.recipeId}
          onClick={() =>
            navigate("/recipe/details", {
              state: { recipe: it.recipeForDetail }, // ✅ RecipeDetail로 상세 데이터 그대로 전달
            })
          }
          style={{
            display: "grid",
            gridTemplateColumns: "48px 64px 1fr auto",
            alignItems: "center",
            gap: 12,
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 12,
            cursor: "pointer",
            background: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#ffe9d6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              color: "#ff7a00",
            }}
          >
            {it.rank}
          </div>

          <img
            src={it.imageUrl}
            alt={it.title}
            width={64}
            height={64}
            style={{ objectFit: "cover", borderRadius: 8 }}
            onError={(e) => {
              e.currentTarget.src = "/no-image.png";
            }}
          />

          <div style={{ fontWeight: 600 }}>{it.title}</div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span role="img" aria-label="star">⭐</span>
            <span>{it.avg?.toFixed ? it.avg.toFixed(1) : it.avg}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
