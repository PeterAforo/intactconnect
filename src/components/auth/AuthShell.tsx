"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

const INK = "#0d0b09";

const PHOTOS = {
  p1: "/img/african-american-business-woman-with-laptop.jpg",
  p2: "/img/african-american-woman-with-laptop-cafe.jpg",
  p3: "/img/girls-walk-along-streets-city.jpg",
  p4: "/img/people-identifical-clothes-african-couple-autumn-city.jpg",
  p5: "/img/portrait-african-american-man-sitting-cafe-working-laptop.jpg",
  p6: "/img/software-engineer-coding-laptop-focusing-deep-learning.jpg",
};

type Tile = { kind: "img"; src: string; grow: number } | { kind: "feature"; id: 1 | 2; grow: number };

// Four columns: narrow / wide / wide / narrow — staggered tile heights via flex-grow ratios.
const COLUMNS: Tile[][] = [
  [
    { kind: "img", src: PHOTOS.p1, grow: 1 },
    { kind: "img", src: PHOTOS.p3, grow: 0.72 },
    { kind: "img", src: PHOTOS.p5, grow: 1.05 },
  ],
  [
    { kind: "img", src: PHOTOS.p2, grow: 0.85 },
    { kind: "feature", id: 1, grow: 1.2 },
    { kind: "img", src: PHOTOS.p6, grow: 1.3 },
  ],
  [
    { kind: "img", src: PHOTOS.p4, grow: 1.15 },
    { kind: "img", src: PHOTOS.p5, grow: 0.85 },
    { kind: "feature", id: 2, grow: 1.05 },
    { kind: "img", src: PHOTOS.p3, grow: 0.8 },
  ],
  [
    { kind: "img", src: PHOTOS.p6, grow: 0.95 },
    { kind: "img", src: PHOTOS.p2, grow: 1.05 },
    { kind: "img", src: PHOTOS.p1, grow: 0.8 },
  ],
];

// narrow / wide / wide / narrow column proportions
const COL_FLEX = [0.45, 1, 1, 0.45];

function PhotoTile({ src }: { src: string }) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-[10px]">
      <Image src={src} alt="" fill sizes="(max-width: 768px) 25vw, 15vw" className="object-cover" />
      <div className="absolute inset-0 bg-black/25" />
    </div>
  );
}

function FeatureTile({ id }: { id: 1 | 2 }) {
  if (id === 1) {
    return (
      <div className="relative w-full h-full rounded-[10px] flex flex-col justify-center px-4 sm:px-5 overflow-hidden" style={{ background: INK }}>
        <p className="text-white text-xl sm:text-2xl font-bold leading-[1.05] tracking-tight">
          Earn on<br />every sale.
        </p>
        <p className="text-white/60 text-[10px] sm:text-[11px] mt-2 leading-snug">
          Real margins on Intact&apos;s full catalog — paid to MoMo or bank.
        </p>
      </div>
    );
  }
  return (
    <div className="relative w-full h-full rounded-[10px] flex flex-col justify-center px-4 sm:px-5 overflow-hidden" style={{ background: "#e9e2d6" }}>
      <p className="text-[#0d0b09] text-xl sm:text-2xl font-bold leading-[1.05] tracking-tight">
        No stock.<br />No stress.
      </p>
      <p className="text-[#0d0b09]/55 text-[10px] sm:text-[11px] mt-2 leading-snug">
        We fulfil and deliver. You keep the commission.
      </p>
    </div>
  );
}

function MosaicGrid({ className = "" }: { className?: string }) {
  return (
    <div className={`flex-1 min-h-0 flex gap-[5px] p-[5px] rounded-[16px] ${className}`} style={{ background: INK }}>
      {COLUMNS.map((col, ci) => (
        <div key={ci} className="flex flex-col gap-[5px] min-w-0" style={{ flexGrow: COL_FLEX[ci], flexBasis: 0 }}>
          {col.map((tile, ti) => (
            <div key={ti} className="min-h-0 w-full" style={{ flexGrow: tile.grow, flexBasis: 0 }}>
              {tile.kind === "img" ? <PhotoTile src={tile.src} /> : <FeatureTile id={tile.id} />}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function AuthShell({
  children,
  switchHref,
  switchLabel,
}: {
  children: React.ReactNode;
  switchHref: string;
  switchLabel: string;
}) {
  return (
    <div className="min-h-screen w-full bg-[#efede8] flex items-center justify-center p-2 sm:p-4 md:p-6">
      {/* Near-full-viewport white panel */}
      <div className="w-full max-w-[1240px] h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] min-h-[540px] bg-white rounded-[20px] sm:rounded-[28px] shadow-[0_24px_70px_-20px_rgba(13,11,9,0.25)] border border-black/[0.04] overflow-hidden flex flex-col md:flex-row">

        {/* Mobile mosaic banner */}
        <div className="md:hidden flex gap-[4px] p-[4px] h-[104px] shrink-0" style={{ background: INK }}>
          {[PHOTOS.p1, PHOTOS.p2, PHOTOS.p3, PHOTOS.p4].map((src, i) => (
            <div key={i} className="relative flex-1 min-w-0 overflow-hidden rounded-[8px]">
              <Image src={src} alt="" fill sizes="25vw" className="object-cover" />
              <div className="absolute inset-0 bg-black/25" />
            </div>
          ))}
        </div>

        {/* Desktop mosaic — ~68% */}
        <div className="hidden md:flex w-[68%] min-w-0 p-2 sm:p-2.5">
          <MosaicGrid className="rounded-[18px]" />
        </div>

        {/* Auth pane — ~32%, light surface */}
        <div className="flex-1 md:w-[32%] min-w-0 flex flex-col bg-white relative">
          <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-10">
            <Link
              href={switchHref}
              className="inline-flex items-center h-8 px-3.5 rounded-full bg-[#f0efec] hover:bg-[#e6e4df] text-[12px] font-medium text-[#3a362f] transition-colors whitespace-nowrap"
            >
              {switchLabel}
            </Link>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center px-5 sm:px-8 py-10">
            <div className="w-[72%] max-w-[300px] min-w-0">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
