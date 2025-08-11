/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { initTheme, toggleTheme, type Theme } from "../lib/theme";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(initTheme());
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header>
      <nav className="bg-white/50 dark:bg-black/30 backdrop-blur-lg p-4 shadow-lg rounded-lg border border-border">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-primary text-2xl font-bold">
            Quantum Simulator
          </Link>

          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/circuit-builder"
              className="text-foreground/90 hover:text-primary transition-colors"
              rel="noopener noreferrer"
              aria-current={
                window.location.pathname === "/circuit-builder"
                  ? "page"
                  : undefined
              }
            >
              Circuit Builder
            </Link>
            <a
              href="https://tutorials.quantumsimulator.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/90 hover:text-primary transition-colors"
            >
              Tutorials
            </a>
            <button
              aria-label="Toggle theme"
              className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm bg-background hover:bg-accent transition-colors"
              onClick={() => setTheme(toggleTheme())}
              title={theme === "dark" ? "Switch to light" : "Switch to dark"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>

          <button
            onClick={toggleMenu}
            className="md:hidden text-foreground text-2xl"
          >
            {isMenuOpen ? "✖️" : "☰"}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white/60 dark:bg-black/40 backdrop-blur-lg text-white py-4 px-6 mt-2 rounded-lg shadow-lg border">
            <Link
              to="/"
              className="block py-2 text-foreground hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/circuit-builder"
              className="block py-2 text-foreground hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Circuit Builder
            </Link>
            <a
              href="https://tutorials.quantumsimulator.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 text-foreground hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Tutorials
            </a>
            <button
              aria-label="Toggle theme"
              className="mt-3 inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm bg-background hover:bg-accent transition-colors w-full"
              onClick={() => setTheme(toggleTheme())}
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>
        )}
      </nav>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://quantumsimulator.in/",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Circuit Builder",
                item: "https://quantumsimulator.in/circuit-builder",
              },
            ],
          }),
        }}
      />
    </header>
  );
};

export default Header;
