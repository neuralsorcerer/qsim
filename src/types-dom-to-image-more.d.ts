/*
 * Copyright Soumyadip Sarkar 2025. All Rights Reserved.
 */

declare module "dom-to-image-more" {
  export interface DomToImageOptions {
    filter?: (node: HTMLElement) => boolean;
    bgcolor?: string;
    width?: number;
    height?: number;
    style?: Partial<CSSStyleDeclaration> | Record<string, string | number>;
    quality?: number;
    imagePlaceholder?: string;
    cacheBust?: boolean;
    fetchRequestCache?: RequestCache;
    fetchRequestCredentials?: RequestCredentials;
    fetchRequestHeaders?: HeadersInit;
    fetchRequestReferrerPolicy?: ReferrerPolicy;
    canvasWidth?: number;
    canvasHeight?: number;
  }

  export function toPng(
    node: HTMLElement,
    options?: DomToImageOptions
  ): Promise<string>;
  export function toJpeg(
    node: HTMLElement,
    options?: DomToImageOptions
  ): Promise<string>;
  export function toSvg(
    node: HTMLElement,
    options?: DomToImageOptions
  ): Promise<string>;
  export function toBlob(
    node: HTMLElement,
    options?: DomToImageOptions
  ): Promise<Blob>;
}
