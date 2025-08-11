/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Header from "./components/Header";
import CircuitBuilder from "./components/CircuitBuilder";
import { HomePage } from "./components/HomePage";
import Footer from "./components/Footer";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

const App: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Router>
        <Header />
        <div className="flex-grow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/circuit-builder" element={<CircuitBuilder />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
        <Footer />
      </Router>
      <SpeedInsights />
      <Analytics />
    </div>
  );
};

export default App;
