import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: "admin@intactconnect.com" } });
  if (!user) {
    console.log("Admin user not found");
    return;
  }
  
  await prisma.user.update({
    where: { email: "admin@intactconnect.com" },
    data: { role: "super_admin" }
  });
  
  console.log("Updated admin role to super_admin");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
