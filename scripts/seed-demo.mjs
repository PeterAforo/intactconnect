import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_USERS = [
  {
    name: "Kwame Asante",
    email: "kwame@demo.com",
    password: "demo1234",
    phone: "0541234567",
    storeName: "Kwame's Tech Hub",
    storeSlug: "kwames-tech-hub",
    picture: "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
    nationalIdType: "ghana_card",
    nationalIdNumber: "GHA-000000001-1",
    nationalIdImage: "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
    momoProvider: "mtn",
    momoNumber: "0541234567",
  },
  {
    name: "Ama Serwaa",
    email: "ama@demo.com",
    password: "demo1234",
    phone: "0271234567",
    storeName: "Ama Beauty Store",
    storeSlug: "ama-beauty-store",
    picture: "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
    nationalIdType: "voter_id",
    nationalIdNumber: "VOT-000000002-2",
    nationalIdImage: "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
    momoProvider: "vodafone",
    momoNumber: "0271234567",
  },
];

async function main() {
  for (const u of DEMO_USERS) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`SKIP  ${u.email} — already exists`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(u.password, 12);

    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        password: hashedPassword,
        phone: u.phone,
        role: "customer",
        emailVerified: true,
        reseller: {
          create: {
            email: u.email,
            storeName: u.storeName,
            storeSlug: u.storeSlug,
            phone: u.phone,
            picture: u.picture,
            nationalIdType: u.nationalIdType,
            nationalIdNumber: u.nationalIdNumber,
            nationalIdImage: u.nationalIdImage,
            momoProvider: u.momoProvider,
            momoNumber: u.momoNumber,
            status: "approved",
          },
        },
      },
    });

    console.log(`OK    ${u.email} — created (userId: ${user.id})`);
  }

  console.log("\n--- Demo Credentials ---");
  console.log("Email: kwame@demo.com  |  Password: demo1234");
  console.log("Email: ama@demo.com    |  Password: demo1234");
  console.log("------------------------");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
