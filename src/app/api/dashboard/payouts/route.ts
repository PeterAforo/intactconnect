import { NextRequest, NextResponse } from "next/server";
import { verifyReseller } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;

  const payouts = await prisma.payout.findMany({
    where: { resellerId: reseller!.id },
    orderBy: { requestedAt: "desc" },
  });

  return NextResponse.json(payouts);
}

export async function POST(request: NextRequest) {
  const { error, reseller } = await verifyReseller(request);
  if (error) return error;

  const { amount, method } = await request.json();
  if (!amount || !method) return NextResponse.json({ error: "Amount and method required" }, { status: 400 });

  const amountNum = parseFloat(amount);
  if (amountNum <= 0) return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
  if (amountNum > reseller!.commissionBalance) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  // Check for pending payouts
  const pendingPayout = await prisma.payout.findFirst({
    where: { resellerId: reseller!.id, status: "requested" },
  });
  if (pendingPayout) {
    return NextResponse.json({ error: "You already have a pending payout request" }, { status: 400 });
  }

  let accountDetails: string;
  if (method === "momo") {
    accountDetails = JSON.stringify({ provider: reseller!.momoProvider, number: reseller!.momoNumber });
  } else {
    accountDetails = JSON.stringify({ bank: reseller!.bankName, account: reseller!.bankAccountNumber, name: reseller!.bankAccountName });
  }

  const payout = await prisma.$transaction(async (tx) => {
    const p = await tx.payout.create({
      data: { resellerId: reseller!.id, amount: amountNum, method, accountDetails },
    });
    await tx.reseller.update({
      where: { id: reseller!.id },
      data: { commissionBalance: { decrement: amountNum } },
    });
    return p;
  });

  return NextResponse.json(payout, { status: 201 });
}
