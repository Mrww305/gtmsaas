import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import SiteRoot from "../site/SiteRoot";
import { ROUTES } from "../site/seo/routes";

export { ROUTES };

export function render(url: string) {
  return renderToString(
    <React.StrictMode>
      <StaticRouter location={url}>
        <SiteRoot />
      </StaticRouter>
    </React.StrictMode>
  );
}
