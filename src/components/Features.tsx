/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import {
  Monitor,
  Cpu,
  Gauge,
  SquareStack,
  MousePointerClick,
  ArrowRightFromLine,
} from "lucide-react";

const features = [
  {
    name: "Quantum Circuit Builder",
    description:
      "Easily design and construct complex quantum circuits with a user-friendly interface. Add gates, modify qubits, and simulate quantum behavior in just a few clicks.",
    icon: Cpu,
  },
  {
    name: "Bloch Sphere Visualization",
    description:
      "Visualize qubit states in 3D using Bloch spheres, providing an intuitive representation of quantum states and superpositions for both single and multi-qubit systems.",
    icon: Monitor,
  },
  {
    name: "Real-Time Simulations",
    description:
      "Experience the power of real-time quantum circuit simulations, instantly observing the results of your quantum operations and how they affect your qubits.",
    icon: Gauge,
  },
  {
    name: "Multi-Qubit Support",
    description:
      "Simulate circuits with multiple qubits, applying gates like CNOT, Swap, and Hadamard across various qubit configurations to test complex quantum algorithms with ease.",
    icon: SquareStack,
  },
  {
    name: "Export and Share Circuits",
    description:
      "Easily export your quantum circuits as JSON files, allowing you to share your designs with others or save them for future use.",
    icon: ArrowRightFromLine,
  },
  {
    name: "User-Friendly Interface",
    description:
      "Enjoy a user-friendly interface that makes it easy to create and simulate quantum circuits, with a clean and intuitive design.",
    icon: MousePointerClick,
  },
];

export function Features() {
  return (
    <div className="py-24 sm:py-32">
      <div className="max-w-2xl mx-auto lg:text-center">
        <p className="font-semibold leading-7 text-primary">Key Features</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Build and simulate complex quantum circuits effortlessly in just a few
          clicks.
        </h1>
        <p className="mt-6 text-base leading-snug text-muted-foreground">
          Right here you can design and simulate quantum circuits in minutes. We
          make it simple and fast to visualize quantum states with ease.
        </p>
      </div>

      <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
        <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
          {features.map((feature) => (
            <div key={feature.name} className="relative pl-16">
              <div className="text-base font-semibold leading-7">
                <div className="absolute left-0 top-0 flex size-10 items-center justify-center rounded-lg bg-primary">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                {feature.name}
              </div>
              <p className="mt-2 text-sm text-muted-foreground leading-snug">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
