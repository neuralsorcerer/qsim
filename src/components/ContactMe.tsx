/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import { Mail } from "lucide-react";
import React from "react";

const contactDetails = [
  {
    name: "Email",
    description: "Feel free to reach out via email at any time.",
    icon: Mail,
    href: "mailto:soumyadip@soumyadipsarkar.com",
    detail: "soumyadip@soumyadipsarkar.com",
  },
];

export function ContactMe() {
  return (
    <div className="py-24 sm:py-32">
      <div className="max-w-2xl mx-auto lg:text-center">
        <p className="font-semibold leading-7 text-primary">Contact Me</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Get in touch with me
        </h1>
        <p className="mt-6 text-base leading-snug text-muted-foreground">
          Whether you have questions, feedback, or need assistance, feel free to
          reach out. I am happy to connect.
        </p>
      </div>

      <div className="mx-auto mt-10 flex justify-center items-center sm:mt-12 lg:mt-12">
        <div key={contactDetails[0].name} className="relative pl-16">
          <div className="text-base font-semibold leading-7">
            <div className="absolute left-0 top-0 flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              {React.createElement(contactDetails[0].icon, {
                className: "w-6 h-6 text-white",
              })}
            </div>
            {contactDetails[0].name}
          </div>
          <p className="mt-2 text-sm text-muted-foreground leading-snug">
            {contactDetails[0].description}
          </p>
          <p className="mt-2 text-base font-medium text-primary">
            <a href={contactDetails[0].href}>{contactDetails[0].detail}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
