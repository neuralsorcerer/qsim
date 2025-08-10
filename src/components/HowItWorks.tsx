/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import { Wrench, PlayCircle, Share2 } from "lucide-react";

const howItWorks = [
  {
    name: "Build your circuit",
    description: "Add gates and configure qubits with an intuitive interface.",
    icon: Wrench,
  },
  {
    name: "Run the simulation",
    description:
      "Execute your circuit to see probabilities and Bloch spheres update in real time.",
    icon: PlayCircle,
  },
  {
    name: "Share the results",
    description:
      "Export circuits as JSON files so you can easily share or reload them later.",
    icon: Share2,
  },
];

export function HowItWorks() {
  return (
    <div className="py-24 sm:py-32">
      <div className="max-w-2xl mx-auto lg:text-center">
        <p className="font-semibold leading-7 text-primary">How it works</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Effortlessly build and simulate quantum circuits in minutes
        </h1>
        <p className="mt-6 text-base leading-snug text-muted-foreground">
          Design and simulate quantum circuits with ease. Our intuitive
          interface allows you to quickly add gates, configure qubits, and
          visualize quantum states in 3D.
        </p>
      </div>

      <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
        <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
          {howItWorks.map((feature) => (
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
