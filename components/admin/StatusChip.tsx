"use client";

export function StatusChip({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    pending: "bg-[#f3eee4] text-[#6b5428]",
    approved: "bg-[#e4f1ec] text-[#0f6e56]",
    rejected: "bg-[#f6e6e6] text-[#8B1E1E]",
    duplicate: "bg-[#eceff2] text-[#5C6770]",
    investigating: "bg-[#e7eef6] text-[#3D5A80]",
  };
  const className = styles[status] ?? styles.pending;

  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${className}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
