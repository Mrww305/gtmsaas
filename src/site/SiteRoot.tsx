import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Platform from "./pages/Platform";
import Solutions from "./pages/Solutions";
import SolutionDetail from "./pages/SolutionDetail";
import Integrations from "./pages/Integrations";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

export default function SiteRoot() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/platform" element={<Platform />} />
      <Route path="/solutions" element={<Solutions />} />
      <Route path="/solutions/:slug" element={<SolutionDetail />} />
      <Route path="/integrations" element={<Integrations />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
