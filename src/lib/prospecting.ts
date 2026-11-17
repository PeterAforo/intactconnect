// Prospecting helpers — OpenStreetMap Nominatim geocoding + Overpass business search.
// Free, no API key required. See plan: https://... (CRM megaplan)

export interface OSMResult {
  sourceId: string;
  name: string;
  type: "business" | "individual";
  category: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  area: string | null;
  latitude: number;
  longitude: number;
  score: number;
}

const USER_AGENT = "IntactConnect-CRM/1.0 (reseller prospecting; contact: intactghana.com)";

const CATEGORY_KEYWORDS: Record<string, { tags: string; kw: RegExp }> = {
  shop: { tags: 'shop~".*"', kw: /shop|store|market|supermarket|pharmacy|boutique/i },
  restaurant: { tags: 'amenity~"restaurant|fast_food|cafe|bar|pub"', kw: /restaurant|food|cafe|kitchen|grill|chop|eatery/i },
  electronics: { tags: 'shop~"electronics|mobile_phone|computer|appliance"', kw: /electronic|phone|computer|laptop|appliance|tv|radio/i },
  salon: { tags: 'shop~"hairdresser|beauty|massage"|leisure~"fitness_centre|sports_centre"', kw: /salon|barber|beauty|spa|gym|fitness/i },
  office: { tags: 'office~".*"', kw: /office|company|services|agency|consult/i },
  school: { tags: 'amenity~"school|college|university|kindergarten"', kw: /school|academy|college|university|daycare/i },
  healthcare: { tags: 'amenity~"clinic|doctors|hospital|pharmacy"|healthcare~".*"', kw: /clinic|hospital|pharmacy|doctor|health|dental/i },
  hotel: { tags: 'tourism~"hotel|guest_house|motel"', kw: /hotel|guest|lodge|inn|motel/i },
  auto: { tags: 'shop~"car|tyres|car_repair"|amenity~"fuel"', kw: /auto|car|tyre|mechanic|fuel|garage/i },
  all: { tags: 'name~".*"', kw: /.*/ },
};

export function categoryFilter(category?: string | null): { tags: string; kw: RegExp } {
  if (!category || category === "all") return CATEGORY_KEYWORDS.all;
  return CATEGORY_KEYWORDS[category] || CATEGORY_KEYWORDS.all;
}

export async function geocodeArea(area: string): Promise<{ lat: number; lng: number; label: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(area + ", Ghana")}&format=json&limit=1&countrycodes=gh`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, next: { revalidate: 86400 } });
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name };
  } catch {
    return null;
  }
}

function buildOverpassQuery(lat: number, lng: number, radiusM: number, cat: { tags: string; kw: RegExp }): string {
  // Fetch named features with any contact-ish tags in the bbox, then filter by category keyword client-side.
  return `[out:json][timeout:25];
(
  node["name"]["phone"](around:${radiusM},${lat},${lng});
  node["name"]["contact:phone"](around:${radiusM},${lat},${lng});
  node["name"]["website"](around:${radiusM},${lat},${lng});
  node["name"]["email"](around:${radiusM},${lat},${lng});
  node["name"]["contact:email"](around:${radiusM},${lat},${lng});
  way["name"]["phone"](around:${radiusM},${lat},${lng});
  way["name"]["contact:phone"](around:${radiusM},${lat},${lng});
  way["name"]["website"](around:${radiusM},${lat},${lng});
  way["name"]["email"](around:${radiusM},${lat},${lng});
  way["name"]["contact:email"](around:${radiusM},${lat},${lng});
);
out tags center ${Math.min(200, radiusM > 10000 ? 500 : 100)};`;
}

function tagStr(tags: Record<string, string>, keys: string[]): string | null {
  for (const k of keys) {
    const v = tags[k];
    if (v && v.trim()) return v.trim();
  }
  return null;
}

function scoreResult(r: OSMResult): number {
  let s = 0;
  if (r.phone) s += 3;
  if (r.email) s += 3;
  if (r.website) s += 2;
  s += 1; // has coords by definition
  if (r.category) s += 1;
  return Math.min(10, s);
}

export async function searchOsmBusinesses(opts: {
  lat: number; lng: number; radiusKm: number; category?: string | null; areaLabel?: string;
}): Promise<OSMResult[]> {
  const cat = categoryFilter(opts.category);
  const radiusM = Math.min(opts.radiusKm * 1000, 25000);
  const ql = buildOverpassQuery(opts.lat, opts.lng, radiusM, cat);

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT },
    body: `data=${encodeURIComponent(ql)}`,
  });
  if (!res.ok) throw new Error(`Overpass error ${res.status}`);
  const json = await res.json();
  const elements: any[] = json.elements || [];

  const seen = new Set<string>();
  const out: OSMResult[] = [];

  for (const el of elements) {
    const tags = el.tags || {};
    const name = tagStr(tags, ["name", "brand"]);
    if (!name) continue;
    if (!cat.kw.test(name) && cat.tags !== 'name~".*"') {
      // also allow category-tag match for non-"all" searches
      const catTags = ["shop", "amenity", "office", "tourism", "leisure", "healthcare"].map((k) => tags[k]).filter(Boolean).join(" ");
      if (!cat.kw.test(catTags)) continue;
    }

    const phone = tagStr(tags, ["phone", "contact:phone", "contact:mobile", "mobile"]);
    const email = tagStr(tags, ["email", "contact:email"]);
    const website = tagStr(tags, ["website", "contact:website", "url"]);
    const address = tagStr(tags, ["addr:housenumber", "addr:street"]) ?
      [tags["addr:housenumber"], tags["addr:street"], tags["addr:suburb"] || tags["addr:neighbourhood"], tags["addr:city"]].filter(Boolean).join(", ") : null;
    const category = tagStr(tags, ["shop", "amenity", "office", "tourism", "craft", "healthcare"]);

    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (!lat || !lng) continue;

    const dedupe = `${name.toLowerCase()}|${phone || ""}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);

    const r: OSMResult = {
      sourceId: `${el.type}/${el.id}`,
      name,
      type: "business",
      category: category || null,
      phone, email, website,
      address,
      area: opts.areaLabel || null,
      latitude: lat, longitude: lng,
      score: 0,
    };
    r.score = scoreResult(r);
    out.push(r);
  }

  // Sort by score desc then name
  out.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return out.slice(0, 300);
}

/** Best-effort email extraction from a business website (homepage + /contact). */
export async function scrapeWebsiteEmail(website: string): Promise<string | null> {
  const base = website.startsWith("http") ? website : `https://${website}`;
  const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const SKIP = /example\.|sentry|wixpress|@2x|\.png|\.jpg|\.jpeg|\.gif|\.webp|\.svg|u003e|schema|w3\.org/i;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const pages = [base, `${base.replace(/\/$/, "")}/contact`, `${base.replace(/\/$/, "")}/contact-us`];
    for (const url of pages) {
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
          signal: controller.signal,
          redirect: "follow",
        });
        if (!res.ok || !(res.headers.get("content-type") || "").includes("html")) continue;
        const html = await res.text();
        const mailto = html.match(/mailto:([^"'?]+)/i)?.[1];
        if (mailto) return decodeURIComponent(mailto.trim());
        const matches = html.match(EMAIL_RE) || [];
        const good = matches.find((m) => !SKIP.test(m));
        if (good) return good;
      } catch { /* try next page */ }
    }
    clearTimeout(timer);
    return null;
  } catch {
    return null;
  }
}
