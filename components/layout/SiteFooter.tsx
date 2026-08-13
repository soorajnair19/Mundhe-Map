import { DISCLAIMER } from "@/lib/branding";

const AUTHOR_URL = "https://www.linkedin.com/in/soorajnair19";
const CONTACT_EMAIL = "soorajuiux@gmail.com";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-[var(--border)] bg-[var(--panel)] px-4 py-4 md:px-6">
      <p className="text-xs leading-relaxed text-[var(--muted)]">{DISCLAIMER}</p>
      <div className="mt-3 grid grid-cols-1 gap-1 text-[11px] text-[var(--muted)] sm:grid-cols-3 sm:items-center">
        <p className="sm:text-left">
          Built by{" "}
          <a
            href={AUTHOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2563eb] underline-offset-2 hover:underline"
          >
            Sooraj Nair
          </a>
        </p>
        <p className="sm:text-center">Open Source Project</p>
        <p className="sm:text-right">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-[#2563eb] underline-offset-2 hover:underline"
          >
            Contact
          </a>
        </p>
      </div>
    </footer>
  );
}
