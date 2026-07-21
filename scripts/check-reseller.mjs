import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const reseller = await prisma.reseller.findUnique({
    where: { storeSlug: "nexdig" },
    include: { user: true }
  });
  
  if (!reseller) {
    console.log("Reseller with slug 'nexdig' not found");
    return;
  }
  
  console.log("Reseller found:");
  console.log(`  Store Name: ${reseller.storeName}`);
  console.log(`  Store Slug: ${reseller.storeSlug}`);
  console.log(`  Status: ${reseller.status}`);
  console.log(`  User Email: ${reseller.user.email}`);
  console.log(`  User Role: ${reseller.user.role}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
