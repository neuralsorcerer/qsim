/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import { Complex as MathJSComplex } from "mathjs";

declare module "mathjs" {
  interface Complex {
    add(other: MathJSComplex): MathJSComplex;
    sub(other: MathJSComplex): MathJSComplex;
    mul(other: MathJSComplex): MathJSComplex;
    div(other: MathJSComplex): MathJSComplex;
    abs(): number;
    arg(): number;
    re(): number;
    im(): number;
    conjugate(): MathJSComplex;
  }
}
