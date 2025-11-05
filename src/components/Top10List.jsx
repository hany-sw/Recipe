export default function Top10List() {
  const recipes = [
    { id: 1, title: "토마토 파스타" },
    { id: 2, title: "계란말이" },
    { id: 3, title: "감자볶음" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {recipes.map((r) => (
        <div
          key={r.id}
          style={{
            border: "1px solid #eee",
            borderRadius: "8px",
            padding: "10px",
            width: "90%",
            maxWidth: "400px",
            textAlign: "center",
            margin: "0 auto",
          }}
        >
          {r.title}
        </div>
      ))}
    </div>
  );
}
