/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white/40 dark:bg-black/30 backdrop-blur-lg py-8 shadow-lg border-t">
      <div className="container mx-auto px-6 mb-4 text-center">
        <p className="text-muted-foreground">
          For the best experience, please view this site on a desktop browser.
        </p>
      </div>
      <div className="container mx-auto px-6 text-center">
        <p className="text-foreground">
          &copy; {new Date().getFullYear()} Quantum Simulator. All rights
          reserved.
        </p>
        <p className="text-foreground">
          Built with ❤️ by{" "}
          <a
            href="https://soumyadipsarkar.com"
            className="text-primary hover:opacity-80"
          >
            Soumyadip Sarkar
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
