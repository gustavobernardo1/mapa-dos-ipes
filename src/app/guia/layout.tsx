import Link from "next/link";
import "./guide.css";
import "./experience.css";
export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="field-guide">
        {children}
        <footer className="fg-footer">
          <span>
            Guia em revisão botânica.{" "}
            <Link href="/guia/fontes#revisao">Saiba mais</Link>
          </span>
          <Link href="/guia/fontes">Fontes e metodologia</Link>
        </footer>
      </div>
    </>
  );
}
