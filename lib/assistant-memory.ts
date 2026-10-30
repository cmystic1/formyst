import { prisma } from "./db";

export type AssistantMessage = { role: "user" | "assistant"; content: string };

const MAX_SAVED_MESSAGES = 40;

export async function loadAssistantHistory(userId: string, formId: string | null, take = 16): Promise<AssistantMessage[]> {
  const rows = await prisma.assistantMessage.findMany({
    where: { userId, formId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    select: { role: true, content: true },
  });
  return rows.reverse().filter((row): row is AssistantMessage => row.role === "user" || row.role === "assistant");
}

export async function saveAssistantExchange(userId: string, formId: string | null, prompt: string, reply: string): Promise<void> {
  const createdAt = new Date();
  await prisma.assistantMessage.createMany({
    data: [
      { userId, formId, role: "user", content: prompt.slice(0, 1200), createdAt },
      { userId, formId, role: "assistant", content: reply.slice(0, 3000), createdAt: new Date(createdAt.getTime() + 1) },
    ],
  });
  const old = await prisma.assistantMessage.findMany({
    where: { userId, formId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: MAX_SAVED_MESSAGES,
    select: { id: true },
  });
  if (old.length) await prisma.assistantMessage.deleteMany({ where: { userId, formId, id: { in: old.map((row) => row.id) } } });
}

export async function clearAssistantHistory(userId: string, formId: string | null): Promise<void> {
  await prisma.assistantMessage.deleteMany({ where: { userId, formId } });
}
