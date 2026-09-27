"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Map,
  Compass,
  Plus,
  Images,
  BookOpen,
  Flower2,
  Menu,
} from "lucide-react";
import { Pwa } from "./pwa";
const links = [
  { href: "/", label: "Mapa", icon: Map },
  { href: "/explorar", label: "Explorar", icon: Compass },
  { href: "/registrar", label: "Registrar", icon: Plus },
  { href: "/galeria", label: "Galeria", icon: Images },
  { href: "/guia", label: "Guia", icon: BookOpen },
];
export function Navigation() {
  const path = usePathname();
  return (
    <>
      <header className="header">
        <Link href="/" className="brand" aria-label="Mapa dos Ipês — início">
          <span className="brand-flower">
            <Flower2 size={30} />
          </span>
          <span>
            Mapa dos Ipês<small>GOIÂNIA · CIÊNCIA CIDADÃ</small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Principal">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`${path === l.href ? "active" : ""} ${l.href === "/registrar" ? "nav-register" : ""}`}
            >
              <l.icon size={18} />
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="header-tools">
          <Link href="/ciencia" className="header-about">
            Por que sua foto importa? ↗
          </Link>
          <details className="header-menu">
            <summary aria-label="Menu">
              <Menu size={20} />
            </summary>
            <div className="header-menu-content">
              <Pwa />
              <Link href="/privacidade">Privacidade</Link>
              <Link href="/ciencia">Por que sua foto importa?</Link>
            </div>
          </details>
        </div>
      </header>
      <nav className="mobile-nav" aria-label="Principal no celular">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={path === l.href ? "page" : undefined}
            className={`${path === l.href ? "active" : ""} ${l.href === "/registrar" ? "nav-register" : ""}`}
          >
            <span>
              <l.icon size={22} />
            </span>
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
