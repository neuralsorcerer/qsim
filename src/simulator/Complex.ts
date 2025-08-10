/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

import { complex, Complex as MathJSComplex } from "mathjs";

export class ComplexNumber {
  public value: MathJSComplex;

  constructor(re: number | MathJSComplex, im: number = 0) {
    if (typeof re === "number") {
      this.value = complex(re, im);
    } else {
      this.value = re;
    }
  }

  add(other: ComplexNumber): ComplexNumber {
    const result = this.value.add(other.value);
    return new ComplexNumber(result.re, result.im);
  }

  sub(other: ComplexNumber): ComplexNumber {
    const result = this.value.sub(other.value);
    return new ComplexNumber(result.re, result.im);
  }

  mul(other: ComplexNumber): ComplexNumber {
    const result = this.value.mul(other.value);
    return new ComplexNumber(result.re, result.im);
  }

  div(other: ComplexNumber): ComplexNumber {
    const result = this.value.div(other.value);
    return new ComplexNumber(result.re, result.im);
  }

  get re(): number {
    return this.value.re;
  }

  get im(): number {
    return this.value.im;
  }

  abs(): number {
    return this.value.abs();
  }

  arg(): number {
    return this.value.arg();
  }

  conjugate(): ComplexNumber {
    const result = this.value.conjugate();
    return new ComplexNumber(result.re, result.im);
  }

  toMathJSComplex(): MathJSComplex {
    return this.value;
  }

  toString(): string {
    return this.value.toString();
  }

  static fromMathJSComplex(value: MathJSComplex): ComplexNumber {
    return new ComplexNumber(value.re, value.im);
  }
}
