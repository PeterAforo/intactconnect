import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { status: "active", stock: { gt: 0 } },
    select: { id: true, name: true, status: true, stock: true },
    take: 10
  });
  
  console.log(`Active products with stock: ${products.length}`);
  products.forEach(p => {
    console.log(`  - ${p.name} (status: ${p.status}, stock: ${p.stock})`);
  });
  
  const totalProducts = await prisma.product.count();
  console.log(`Total products in database: ${totalProducts}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
