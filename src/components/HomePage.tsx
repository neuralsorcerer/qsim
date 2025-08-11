/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import { Features } from "./Features";
import { ContactMe } from "./ContactMe";
import { Link } from "react-router-dom";
import { Button } from "./Button";
import { FaArrowRight } from "react-icons/fa";
import HeroImageLight from "../assets/hero.png";
import HeroImageDark from "../assets/hero-dark.png";
import QuantumMaths from "../assets/quantum-maths.png";
import AnimatedGridPattern from "./magicui/AnimatedGrid";
import { cn } from "../lib/utils";
import { motion } from "framer-motion";
import { HowItWorks } from "./HowItWorks";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";

export function HomePage() {
  const [isDark, setIsDark] = useState<boolean>(() =>
    document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();
    const mo = new MutationObserver(update);
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  const heroSrc = isDark ? HeroImageDark : HeroImageLight;

  return (
    <>
      <Helmet>
        <title>QSim — Quantum Circuit Simulator</title>
        <meta
          name="description"
          content="Design, simulate, and visualize quantum circuits in your browser. Learn superposition, entanglement, Grover's algorithm, and more using QSim."
        />
        <link rel="canonical" href="https://quantumsimulator.in/" />
        <meta property="og:title" content="QSim — Quantum Circuit Simulator" />
        <meta
          property="og:description"
          content="Design, simulate, and visualize quantum circuits in your browser."
        />
        <meta
          property="og:image"
          content="https://quantumsimulator.in/logo.png"
        />
        <meta property="og:url" content="https://quantumsimulator.in/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:image"
          content="https://quantumsimulator.in/logo.png"
        />
      </Helmet>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "QSim",
            url: "https://quantumsimulator.in/",
            logo: "https://quantumsimulator.in/logo.png",
            sameAs: [
              "https://github.com/neuralsorcerer",
              "https://x.com/neuralsorcerer",
            ],
          }),
        }}
      />

      <section className="relative flex items-center justify-center">
        <div className="relative items-center w-full py-12 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <span className="text-sm text-primary font-medium tracking-tight bg-primary/10 px-4 py-2 rounded-full">
              Experimental Quantum Circuit Simulator
            </span>

            <h1 className="mt-8 text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-medium leading-none">
              Welcome to <span className="text-primary">QSim</span>
            </h1>

            <p className="max-w-xl mx-auto mt-4 text-base font-light lg:text-lg text-muted-foreground tracking-tighter">
              Design, simulate, and visualize quantum circuits with intuitive
              tools. Experiment with gates, superposition, and entanglement.
            </p>
            <div className="flex items-center gap-x-5 w-full justify-center mt-5 ">
              <a
                href="https://tutorials.quantumsimulator.in/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary">Tutorials</Button>
              </a>
              <Link to="/circuit-builder">
                <Button variant="default">
                  Get Started <FaArrowRight className="ml-2" />
                </Button>
              </Link>
            </div>
            <AnimatedGridPattern
              numSquares={30}
              maxOpacity={0.1}
              duration={3}
              repeatDelay={1}
              className={cn(
                "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
                "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12",
                "z-[-99999999]"
              )}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative items-center w-full py-10 mx-auto mt-12"
          >
            <svg
              className="absolute -mt-24 blur-3xl"
              fill="none"
              viewBox="0 0 400 400"
              height="100%"
              width="100%"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_10_20)">
                <g filter="url(#filter0_f_10_20)">
                  <path
                    d="M128.6 0H0V322.2L106.2 134.75L128.6 0Z"
                    fill="#03FFE0"
                  ></path>
                  <path
                    d="M0 322.2V400H240H320L106.2 134.75L0 322.2Z"
                    fill="#7C87F8"
                  ></path>
                  <path
                    d="M320 400H400V78.75L106.2 134.75L320 400Z"
                    fill="#4C65E4"
                  ></path>
                  <path
                    d="M400 0H128.6L106.2 134.75L400 78.75V0Z"
                    fill="#043AFF"
                  ></path>
                </g>
              </g>
              <defs>
                <filter
                  colorInterpolationFilters="sRGB"
                  filterUnits="userSpaceOnUse"
                  height="720.666"
                  id="filter0_f_10_20"
                  width="720.666"
                  x="-160.333"
                  y="-160.333"
                >
                  <feFlood
                    floodOpacity="0"
                    result="BackgroundImageFix"
                  ></feFlood>
                  <feBlend
                    in="SourceGraphic"
                    in2="BackgroundImageFix"
                    mode="normal"
                    result="shape"
                  ></feBlend>
                  <feGaussianBlur
                    result="effect1_foregroundBlur_10_20"
                    stdDeviation="80.1666"
                  ></feGaussianBlur>
                </filter>
              </defs>
            </svg>

            <img
              src={heroSrc}
              alt="Hero image"
              className="relative object-cover w-full border rounded-lg shadow-2xl lg:rounded-2xl"
            />
          </motion.div>
        </div>
      </section>
      <Features />
      <HowItWorks />
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <img
                src={QuantumMaths}
                alt="Quantum Computing"
                className="rounded-lg shadow-lg"
              />
            </div>
            <div className="md:w-1/2 md:pl-12">
              <h2 className="text-3xl font-bold mb-4">
                Experience Quantum Computing Like Never Before
              </h2>
              <p className="text-muted-foreground mb-6">
                QSim brings the power of quantum computing to your fingertips.
                Whether you're a researcher, student, or enthusiast, our
                platform provides the tools you need to explore and experiment
                with quantum circuits.
              </p>
              <Link to="/circuit-builder">
                <Button>
                  Get Started <FaArrowRight className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      <ContactMe />
    </>
  );
}
