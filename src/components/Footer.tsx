/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white/30 backdrop-blur-lg py-8 shadow-lg">
      <div className="container mx-auto px-6 mb-4 text-center">
        <p className="text-gray-600">
          For the best experience, please view this site on a desktop browser.
        </p>
      </div>
      <div className="container mx-auto px-6 border-gray-300 text-center">
        <p className="text-gray-800">
          &copy; {new Date().getFullYear()} Quantum Simulator. All rights
          reserved.
        </p>
        <p className="text-gray-800">
          Built with ❤️ by{" "}
          <a
            href="https://soumyadipsarkar.com"
            className="text-blue-500 hover:text-blue-300"
          >
            Soumyadip Sarkar
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
