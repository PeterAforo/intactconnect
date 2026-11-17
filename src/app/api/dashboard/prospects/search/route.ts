import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { geocodeArea, searchOsmBusinesses } from "@/lib/prospecting";

export async function POST(request: NextRequest) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;

  const body = await request.json();
  const { area, category, radiusKm, lat, lng } = body;
  if (!area?.trim() && !(lat && lng)) {
    return NextResponse.json({ error: "Area or coordinates required" }, { status: 400 });
  }

  let coords = lat && lng ? { lat: Number(lat), lng: Number(lng), label: area || "Selected area" } : null;
  if (!coords) {
    coords = await geocodeArea(area.trim());
    if (!coords) {
      return NextResponse.json({ error: `Could not find "${area}" in Ghana. Try a city, town, or neighbourhood (e.g. "Osu, Accra").` }, { status: 404 });
    }
  }

  const radius = Math.min(Math.max(Number(radiusKm) || 3, 0.5), 25);

  let results;
  try {
    results = await searchOsmBusinesses({
      lat: coords.lat, lng: coords.lng, radiusKm: radius,
      category: category || null, areaLabel: area || coords.label,
    });
  } catch (e) {
    return NextResponse.json({ error: "Business search failed — try again or pick a different area." }, { status: 502 });
  }

  await prisma.prospectSearch.create({
    data: {
      resellerId: reseller!.id,
      area: area || coords.label,
      category: category || null,
      radiusKm: radius,
      lat: coords.lat, lng: coords.lng,
      results: results.length,
    },
  });

  return NextResponse.json({ results, area: coords.label, radiusKm: radius });
}
