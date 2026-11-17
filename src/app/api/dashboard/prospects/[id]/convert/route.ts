import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Convert a prospect into a ResellerClient, preserving history
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;
  const { id } = await params;

  const prospect = await prisma.prospect.findFirst({ where: { id, resellerId: reseller!.id } });
  if (!prospect) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (prospect.status === "converted" && prospect.clientId) {
    return NextResponse.json({ error: "Already converted", clientId: prospect.clientId }, { status: 400 });
  }

  const isCompany = prospect.type === "business";
  const client = await prisma.resellerClient.create({
    data: {
      resellerId: reseller!.id,
      clientType: isCompany ? "company" : "individual",
      name: prospect.name,
      email: prospect.email,
      phone: prospect.phone,
      address: prospect.address,
      digitalAddress: null,
      city: prospect.area,
      region: null,
      landmark: null,
      latitude: prospect.latitude,
      longitude: prospect.longitude,
      companyName: isCompany ? prospect.name : null,
      notes: [
        prospect.notes,
        `Converted from prospect${prospect.source ? ` (source: ${prospect.source})` : ""}.`,
        prospect.category ? `Category: ${prospect.category}` : null,
      ].filter(Boolean).join("\n"),
    },
  });

  await prisma.prospect.update({
    where: { id },
    data: { status: "converted", clientId: client.id },
  });
  await prisma.prospectActivity.create({
    data: { prospectId: id, type: "status_change", body: "Converted to client", metadata: JSON.stringify({ clientId: client.id }) },
  });

  return NextResponse.json({ client, prospectId: id }, { status: 201 });
}
