import { DISCLAIMER, FOOTER_NOTE, PRODUCT_NAME } from "@/lib/branding";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--panel)] px-4 py-4 md:px-6">
      <p className="text-xs leading-relaxed text-[var(--muted)]">{DISCLAIMER}</p>
      <p className="mt-2 text-[11px] text-[var(--muted)]">
        {FOOTER_NOTE} · {PRODUCT_NAME}
      </p>
    </footer>
  );
}
