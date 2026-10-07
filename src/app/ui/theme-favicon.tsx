"use client";

import { useEffect } from "react";
import { useTheme } from "@/app/ui/theme";

const LIGHT_ICON = "/icons/avatar-light.png";

// The tab icon is the straight-on portrait (app/icon.png); in light mode it
// swaps to the sunglasses version. Next.js replaces the icon <link> when the
// page changes, so a watch on <head> re-applies the swap whenever that happens.
export function ThemeFavicon() {
  const theme = useTheme();

  useEffect(() => {
    function apply() {
      for (const link of document.querySelectorAll<HTMLLinkElement>(
        'link[rel="icon"]',
      )) {
        const current = link.getAttribute("href") ?? "";
        if (current !== LIGHT_ICON) link.dataset.darkHref = current;
        const href = theme === "light" ? LIGHT_ICON : link.dataset.darkHref;
        if (href && current !== href) link.setAttribute("href", href);
      }
    }
    apply();
    const watch = new MutationObserver(apply);
    watch.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href"],
    });
    return () => watch.disconnect();
  }, [theme]);

  return null;
}
