/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import { Features } from "./Features";
import { ContactMe } from "./ContactMe";
import { Link } from "react-router-dom";
import { Button } from "./Button";
import { FaArrowRight } from "react-icons/fa";
import HeroImage from "../assets/hero.png";
import QuantumMaths from "../assets/quantum-maths.png";
import AnimatedGridPattern from "./magicui/AnimatedGrid";
import { cn } from "../lib/utils";
import { motion } from "framer-motion";
import { HowItWorks } from "./HowItWorks";

export function HomePage() {
  return (
    <>
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
              Easily design, simulate, and visualize quantum circuits with
              intuitive tools that allow you to experiment with quantum gates
              and qubit states effortlessly.
            </p>
            <div className="flex items-center gap-x-5 w-full justify-center mt-5 ">
              <Link to="https://tutorials.quantumsimulator.in/">
                <Button variant="secondary">Tutorials</Button>
              </Link>
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
              src={HeroImage}
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
              <p className="text-gray-600 mb-6">
                QSim brings the power of quantum computing to your fingertips.
                Whether you're a researcher, student, or enthusiast, our
                platform provides the tools you need to explore and experiment
                with quantum circuits.
              </p>
              <Link to="/circuit-builder">
                <button className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition duration-300 flex items-center">
                  Get Started <FaArrowRight className="ml-2" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      <ContactMe />
    </>
  );
}
