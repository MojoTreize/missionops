export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        padding: "1.5rem",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "1.75rem", margin: 0 }}>MissionOps</h1>
      <p style={{ color: "#6B7770", margin: 0 }}>
        Le système d&apos;exploitation des missions terrain.
      </p>
      <p style={{ color: "#6B7770", margin: 0, fontSize: "0.875rem" }}>
        Socle technique — Bloc B1.1. Le produit se construit un bloc à la fois.
      </p>
    </main>
  );
}
