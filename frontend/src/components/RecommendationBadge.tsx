import type { RecommendationDecision } from "../types/report";

const badgeStyles: Record<RecommendationDecision, string> = {
  Build: "bg-green-100 text-green-800 border-green-200",
  Pivot: "bg-amber-100 text-amber-800 border-amber-200",
  "Research Further": "bg-sky-100 text-sky-800 border-sky-200",
  Avoid: "bg-red-100 text-red-800 border-red-200",
};

interface RecommendationBadgeProps {
  decision: RecommendationDecision;
}

export function RecommendationBadge({ decision }: RecommendationBadgeProps) {
  return (
    <span className={`inline-flex rounded-md border px-3 py-1 text-sm font-semibold ${badgeStyles[decision]}`}>
      {decision}
    </span>
  );
}
