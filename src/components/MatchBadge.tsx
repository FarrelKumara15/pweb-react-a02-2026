export function MatchBadge({ score }: { score: number }) {
  return (
    <span
      className={`match ${score >= 70 ? "high" : score >= 40 ? "medium" : "low"}`}
    >
      {score}% match
    </span>
  );
}
