import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { seedDemoClients, seedLibrary, seedTrainer } from "../src/seedData";

const prisma = new PrismaClient();

async function main() {
  const trainerUsername = process.env.TRAINER_USERNAME || "tom";
  const trainerPassword = process.env.TRAINER_PASSWORD || "boedtcamp";

  await seedTrainer(prisma, trainerUsername, trainerPassword);
  await seedLibrary(prisma);
  const demo = await seedDemoClients(prisma);
  demo.forEach((c) => console.log(`Klant aangemaakt: ${c.naam} — pincode ${c.pin}`));

  console.log(`Trainer login: ${trainerUsername} / ${trainerPassword}`);
  console.log("Klaar.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
