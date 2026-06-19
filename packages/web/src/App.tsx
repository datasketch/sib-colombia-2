import { Routes, Route } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { Home } from "./pages/Home";
import { Region } from "./pages/Region";
import { Municipality } from "./pages/Municipality";
import { Glossary } from "./pages/Glossary";
import { FAQ } from "./pages/FAQ";
import { About } from "./pages/About";
import { Methodology } from "./pages/Methodology";
import { Press } from "./pages/Press";
import { Publishers } from "./pages/Publishers";
import { Explorador } from "./pages/Explorador";
import { NotFound } from "./pages/NotFound";

export default function App() {

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/colombia" element={<Region />} />
          <Route path="/explorador" element={<Explorador />} />
          <Route path="/mas/publicadores" element={<Publishers />} />
          <Route path="/mas/glosario" element={<Glossary />} />
          <Route path="/mas/preguntas-frecuentes" element={<FAQ />} />
          <Route path="/mas/metodologia" element={<Methodology />} />
          <Route path="/mas/prensa" element={<Press />} />
          <Route path="/mas/acerca-de" element={<About />} />
          {/* Special regions route for legacy URL compatibility */}
          <Route path="/especial/:slug" element={<Region />} />

          {/* Department / region pages (catch-all) */}
          <Route path="/:slug/:municipio" element={<Municipality />} />
          <Route path="/:slug" element={<Region />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
