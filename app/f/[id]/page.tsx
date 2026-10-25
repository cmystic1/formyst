import { notFound } from "next/navigation";
import { connection } from "next/server";
import { FormFrame } from "@/components/form-frame";
import { PublicForm } from "@/components/public-form";
import { getFormDefinition } from "@/lib/store";

export const metadata = { title: "Form · Formyst" };
export const instant = false;
export default async function PublicFormPage({ params }: PageProps<"/f/[id]">) {
  await connection();
  const { id } = await params;
  const form = await getFormDefinition(id);
  if (!form || form.fields.length === 0) notFound();
  return <FormFrame form={form} fullPage><PublicForm formId={id} form={form} /></FormFrame>;
}
