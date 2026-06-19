import { useEffect, useState } from "react";

interface Section {
  id: string;
  label: string;
}

interface Props {
  regionLabel: string;
  sections: Section[];
}

/**
 * Sticky navbar with scroll-spy and smooth-scroll to sections.
 * Port of StickyNavbar.jsx — appears after scrolling past the banner (~550px).
 */
export function StickyNavbar({ regionLabel, sections }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 550);

      let current = "";
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const offset = 100;
        if (rect.top <= offset && rect.bottom > offset) {
          current = section.id;
          break;
        }
      }
      setActiveSection(current);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 80;
    window.scrollTo({
      top: el.offsetTop - offset,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-default">
      <div className="mx-auto w-10/12 max-w-screen-2xl">
        <div className="flex items-center justify-between py-3">
          {/* Region label + logo */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
          >
            <img
              className="h-6 w-auto"
              style={{ filter: "grayscale(100%) brightness(0.6)" }}
              src="/images/logo-biodiversidadcifras.svg"
              alt=""
            />
            <span className="text-base font-bold text-gray-800">{regionLabel}</span>
          </button>

          {/* Section nav */}
          <nav className="flex items-center gap-6 overflow-x-auto">
            {sections.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollTo(section.id)}
                  className={`flex-shrink-0 px-3 py-2 text-sm font-medium transition relative whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "text-dartmouth-green"
                      : "text-gray-700 hover:text-dartmouth-green"
                  }`}
                >
                  {section.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dartmouth-green" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
