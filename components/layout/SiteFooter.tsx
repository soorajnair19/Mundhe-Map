import { DISCLAIMER } from "@/lib/branding";

const AUTHOR_URL = "https://www.linkedin.com/in/soorajnair19";
const CONTACT_EMAIL = "soorajuiux@gmail.com";

const linkClass = "text-white underline underline-offset-2 hover:text-white/80";

export function SiteFooter() {
  return (
    <footer className="relative z-10 bg-black px-4 py-2.5 md:px-6">
      <p className="text-center text-xs leading-snug text-white/70">
        {DISCLAIMER}
        <span className="mx-1.5 text-white/35">·</span>
        Built by{" "}
        <a
          href={AUTHOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          Sooraj Nair
        </a>
        <span className="mx-1.5 text-white/35">·</span>
        <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
          Contact
        </a>
      </p>
    </footer>
  );
}
