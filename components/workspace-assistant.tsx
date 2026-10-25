"use client";

import { useState } from "react";
import { AIChatLauncher, AIFormAssistant } from "@/components/builder/ai-form-assistant";

export function WorkspaceAssistant() {
  const [open, setOpen] = useState(false);
  return open
    ? <AIFormAssistant mode="help" onClose={() => setOpen(false)} />
    : <AIChatLauncher onClick={() => setOpen(true)} />;
}
