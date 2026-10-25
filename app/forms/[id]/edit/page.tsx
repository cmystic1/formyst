import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Builder } from "@/components/builder/builder";
import { getCurrentUser } from "@/lib/auth";
import { defaultFormDefinition } from "@/lib/form-schema";
import { getFormDefinition, getOwnedForm } from "@/lib/store";

export const metadata = { title: "Form builder · Formyst" };
export const instant = false;
export default async function BuilderPage({ params }: PageProps<"/forms/[id]/edit">) {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const row = await getOwnedForm(user.id, id);
  if (!row) notFound();
  const saved = await getFormDefinition(id, user.id);
  return <Builder formId={id} initialForm={saved ?? defaultFormDefinition()} isPublished={row.published} canManageUsers={user.role === "admin"} />;
}
