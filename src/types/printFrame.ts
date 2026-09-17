export type PageFormat = 'A4' | 'LETTER' | 'A3';
export type PageOrientation = 'landscape' | 'portrait';

export interface PrintFrame {
  id: string;
  pageNumber: number;
  format: PageFormat;
  orientation: PageOrientation;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const DEFAULT_PAGE_DIMENSIONS: Record<
  PageFormat,
  Record<PageOrientation, { width: number; height: number; mmWidth: number; mmHeight: number }>
> = {
  A4: {
    landscape: { width: 1188, height: 840, mmWidth: 297, mmHeight: 210 },
    portrait: { width: 840, height: 1188, mmWidth: 210, mmHeight: 297 },
  },
  LETTER: {
    landscape: { width: 1100, height: 850, mmWidth: 279.4, mmHeight: 215.9 },
    portrait: { width: 850, height: 1100, mmWidth: 215.9, mmHeight: 279.4 },
  },
  A3: {
    landscape: { width: 1680, height: 1188, mmWidth: 420, mmHeight: 297 },
    portrait: { width: 1188, height: 1680, mmWidth: 297, mmHeight: 420 },
  },
};

export function getFrameAspectRatio(format: PageFormat, orientation: PageOrientation): number {
  const dim = DEFAULT_PAGE_DIMENSIONS[format][orientation];
  return dim.width / dim.height;
}
