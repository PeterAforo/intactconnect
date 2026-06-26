import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_USER = {
  name: "IntactConnect Admin",
  email: "admin@intactconnect.com",
  password: "admin123",
  phone: "0543008475",
  role: "super_admin",
};

async function main() {
  // Check if admin already exists
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_USER.email } });
  if (existing) {
    console.log(`SKIP  ${ADMIN_USER.email} — already exists`);
    console.log(`      Current role: ${existing.role}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_USER.password, 12);

  const user = await prisma.user.create({
    data: {
      name: ADMIN_USER.name,
      email: ADMIN_USER.email,
      password: hashedPassword,
      phone: ADMIN_USER.phone,
      role: ADMIN_USER.role,
      emailVerified: true,
    },
  });

  console.log(`OK    ${ADMIN_USER.email} — created (userId: ${user.id})`);
  console.log("\n--- Admin Credentials ---");
  console.log(`Email: ${ADMIN_USER.email}`);
  console.log(`Password: ${ADMIN_USER.password}`);
  console.log(`Role: ${ADMIN_USER.role}`);
  console.log("------------------------");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
