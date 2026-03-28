import type { FrontendMatchPrepMode } from "@/lib/frontend-config";

type DataModeBadgeProps = {
  mode: FrontendMatchPrepMode;
};

export function DataModeBadge({ mode }: DataModeBadgeProps) {
  const isLive = mode === "live";

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium"
      style={{
        backgroundColor: isLive
          ? "rgba(224, 255, 106, 0.1)"
          : "rgba(96, 165, 250, 0.1)",
        color: isLive ? "var(--accent-lime)" : "var(--accent-blue)",
        border: `1px solid ${
          isLive ? "rgba(224, 255, 106, 0.3)" : "rgba(96, 165, 250, 0.3)"
        }`,
      }}
    >
      <span>{isLive ? "Live via TinyFish" : "Mock data"}</span>
    </span>
  );
}
