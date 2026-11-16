import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import SiteRoot from "./site/SiteRoot.tsx";
import DemoRoot from "./demo/DemoRoot.tsx";

const container = document.getElementById("root")!;

const tree = (
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/demo/*" element={<DemoRoot />} />
        <Route path="*" element={<SiteRoot />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// Prerendered pages ship markup in #root; hydrate those. A pristine shell (demo) mounts fresh.
if (container.hasChildNodes()) {
  ReactDOM.hydrateRoot(container, tree);
} else {
  ReactDOM.createRoot(container).render(tree);
}
