import { Router } from "express";
import { prisma } from "../db";
import { requireTrainer } from "../middleware/auth";

const router = Router();
router.use(requireTrainer);

router.get("/library", async (req, res) => {
  const { goal, muscle, q } = req.query as { goal?: string; muscle?: string; q?: string };
  const where: Record<string, unknown> = {};
  if (goal && goal !== "all") where.doel = goal;
  if (muscle && muscle !== "all") where.primaireSpier = muscle;
  if (q) {
    where.OR = [
      { naam: { contains: q, mode: "insensitive" } },
      { materiaal: { contains: q, mode: "insensitive" } },
    ];
  }
  const items = await prisma.libraryExercise.findMany({ where, orderBy: { naam: "asc" }, take: 200 });
  const total = await prisma.libraryExercise.count();
  res.json({ items, total });
});

router.get("/library/muscles", async (_req, res) => {
  const rows = await prisma.libraryExercise.findMany({
    select: { primaireSpier: true },
    distinct: ["primaireSpier"],
    orderBy: { primaireSpier: "asc" },
  });
  res.json(rows.map((r) => r.primaireSpier));
});

export default router;
