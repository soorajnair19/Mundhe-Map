import { DISCLAIMER, DISCLAIMER_AFFILIATION } from "@/lib/branding";

const AUTHOR_URL = "https://www.linkedin.com/in/soorajnair19";
const CONTACT_EMAIL = "soorajuiux@gmail.com";

const linkClass =
  "text-[var(--accent)] underline underline-offset-2";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-[var(--border)] bg-[var(--panel)] px-4 py-2.5 md:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex-1 text-xs leading-snug text-[var(--muted)]">
          <p>{DISCLAIMER}</p>
          <p className="mt-0.5">{DISCLAIMER_AFFILIATION}</p>
        </div>
        <div className="shrink-0 text-xs leading-snug text-[var(--muted)] sm:text-right">
          <p>
            Built by{" "}
            <a
              href={AUTHOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              Sooraj Nair
            </a>
          </p>
          <p>
            <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
              Contact
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
