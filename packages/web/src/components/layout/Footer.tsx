import { useApp } from "../../context/AppContext";

export function Footer() {
  const { footerBgColor } = useApp();

  return (
    <footer className={`${footerBgColor} bg-cover bg-center pt-12 pb-4 text-white`}>
      <div className="max-w-screen-xl mx-auto px-6 lg:px-20">
        <div className="flex flex-col gap-y-8 lg:flex-row justify-between">
          <a
            href="https://biodiversidad.co"
            target="_blank"
            rel="noreferrer"
            className="self-start"
          >
            <img
              className="h-10"
              src="/images/sib-icon.svg"
              alt="SiB Colombia"
            />
          </a>

          <div className="flex flex-col gap-y-6 lg:flex-row gap-x-16">
            <FooterColumn
              title="Acerca de"
              links={[
                { label: "Esta versión", href: "/mas/acerca-de" },
                { label: "Metodología", href: "/mas/metodologia" },
                { label: "Datos", href: "https://gitlab.com/sib-colombia/cifras-biodiversidad", external: true },
                { label: "Cómo citar", href: "/mas/acerca-de#como-citar" },
                { label: "Reportar inconsistencias", href: "https://github.com/datasketch/Biodiversidad en Cifras/issues", external: true },
              ]}
            />
            <FooterColumn
              title="Enlaces"
              links={[
                { label: "SiB Colombia", href: "https://biodiversidad.co/", external: true },
                { label: "Términos y condiciones", href: "https://biodiversidad.co/terminos-y-condiciones/politica-de-uso", external: true },
                { label: "Suscríbete al boletín", href: "https://biodiversidad.co/boletin", external: true },
              ]}
            />
            <FooterColumn
              title="Contacto"
              links={[
                { label: "sib@humboldt.org.co", href: "mailto:sib@humboldt.org.co" },
              ]}
            >
              <span className="text-xs">Calle 72 # 12 - 65 Piso 7</span>
              <span className="text-xs">
                Teléfonos de contacto: +57 310 215 8291 +57 310 215 8287
              </span>
              <span className="text-xs">Bogotá D.C., Colombia</span>
              <div className="flex gap-x-4 justify-center lg:justify-start items-center pt-1">
                <a
                  href="https://twitter.com/sibcolombia"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="X (antes Twitter)"
                >
                  <img src="/images/icons/icon-x.svg" className="h-5 w-5" alt="X" />
                </a>
                <a
                  href="https://www.facebook.com/SibColombia"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                >
                  <img src="/images/icons/icon-fb.svg" className="h-5 w-6" alt="Facebook" />
                </a>
                <a
                  href="https://www.youtube.com/user/sibcolombia"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                >
                  <img src="/images/icons/icon-yt.svg" className="h-5 w-5" alt="YouTube" />
                </a>
              </div>
            </FooterColumn>
          </div>
        </div>

        <div className="mt-10 mx-auto w-2/3 lg:w-1/6 text-center">
          <div className="border-b border-white/40" />
          <div className="py-3">
            <a href="https://datasketch.co" target="_blank" rel="noreferrer">
              <img
                className="h-6 mx-auto"
                src="/images/powered-by.svg"
                alt="Powered by Datasketch"
                onError={(e) => {
                  // Hide if image not found
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

function FooterColumn({
  title,
  links,
  children,
}: {
  title: string;
  links: FooterLink[];
  children?: React.ReactNode;
}) {
  return (
    <div className="text-center lg:text-left flex flex-col gap-y-2 text-sm font-lato">
      <strong className="font-bold">{title}</strong>
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target={link.external ? "_blank" : undefined}
          rel={link.external ? "noreferrer" : undefined}
          className="hover:text-yellow-green"
        >
          {link.label}
        </a>
      ))}
      {children}
    </div>
  );
}
