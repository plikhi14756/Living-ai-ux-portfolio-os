import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/projects", label: "Projects" },
  { href: "/experience-log", label: "Log" },
  { href: "/about", label: "About" },
  { href: "/documents", label: "Documents" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/86 backdrop-blur-xl dark:border-white/10 dark:bg-[#131818]/86">
      <div className="container-page flex min-h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="text-sm font-black uppercase text-ink dark:text-paper"
        >
          Pranav Likhi
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              className="rounded-lg px-3 py-2 text-sm font-semibold text-ink/72 transition hover:bg-white hover:text-ink dark:text-paper/72 dark:hover:bg-white/10 dark:hover:text-paper"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link className="btn-secondary hidden sm:inline-flex" href="/admin">
            Admin
          </Link>
          <ThemeToggle />
        </div>
      </div>
      <nav className="container-page flex gap-1 overflow-x-auto pb-3 md:hidden">
        {links.map((link) => (
          <Link className="tag shrink-0" href={link.href} key={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
