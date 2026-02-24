export default function NotFound() {
  return (
    <div className="flex items-center justify-center h-screen bg-[var(--c-bg)]">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">あれれ？</h1>
        <p className="text-[var(--c-text-muted)]">
          このページはないみたい。もどってもういちどためしてみてね！
        </p>
      </div>
    </div>
  );
}
