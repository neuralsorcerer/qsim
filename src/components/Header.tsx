/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="bg-white/30 backdrop-blur-lg p-4 shadow-lg rounded-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-blue-500 text-2xl font-bold">
          Quantum Simulator
        </Link>

        <div className="hidden md:flex space-x-4">
          <Link
            to="/circuit-builder"
            className="text-black hover:text-blue-500"
          >
            Circuit Builder
          </Link>
          <Link
            to="https://tutorials.quantumsimulator.in/"
            className="text-black hover:text-blue-500"
          >
            Tutorials
          </Link>
        </div>

        <button onClick={toggleMenu} className="md:hidden text-black text-2xl">
          {isMenuOpen ? "✖️" : "☰"}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white/20 backdrop-blur-lg text-white py-4 px-6 mt-2 rounded-lg shadow-lg">
          <Link
            to="/"
            className="block py-2 text-black hover:text-blue-500"
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/circuit-builder"
            className="block py-2 text-black hover:text-blue-500"
            onClick={() => setIsMenuOpen(false)}
          >
            Circuit Builder
          </Link>
          <Link
            to="https://tutorials.quantumsimulator.in/"
            className="block py-2 text-black hover:text-blue-500"
            onClick={() => setIsMenuOpen(false)}
          >
            Tutorials
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Header;
