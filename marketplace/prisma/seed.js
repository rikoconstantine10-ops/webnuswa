const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  await db.setting.upsert({
    where: { key: "platform_fee_percent" },
    create: { key: "platform_fee_percent", value: "5" },
    update: {},
  });

  const categories = [
    { name: "Produk Digital", slug: "produk-digital" },
    { name: "Fashion", slug: "fashion" },
    { name: "Elektronik", slug: "elektronik" },
    { name: "Makanan & Minuman", slug: "makanan-minuman" },
    { name: "Kerajinan", slug: "kerajinan" },
  ];
  for (const c of categories) {
    await db.category.upsert({ where: { slug: c.slug }, create: c, update: {} });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    await db.user.upsert({
      where: { email: adminEmail.toLowerCase() },
      create: { email: adminEmail.toLowerCase(), role: "ADMIN", name: "Admin" },
      update: { role: "ADMIN" },
    });
    console.log(`Admin user: ${adminEmail}`);
  }

  console.log("Seed selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
