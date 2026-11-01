/**
 * Câmpurile formularelor de taskuri și observații (§10): declarate o singură dată,
 * ca listările și formularele generate din `FieldDef[]` să rămână sincronizate.
 */
import type { FieldDef } from "@/components/resource/fields";
import { PRIORITIES, TASK_STATUSES } from "@shared/enums";

/** Câmpurile unui task: titlu, proiect, prioritate, status, termen și ore. */
export const TASK_FIELDS: FieldDef[] = [
  { name: "title", label: "Titlu", type: "text", required: true },
  { name: "description", label: "Descriere", type: "textarea", span: 2 },
  { name: "projectId", label: "Proiect", type: "relation", endpoint: "/projects", required: true },
  { name: "priority", label: "Prioritate", type: "select", options: PRIORITIES, required: true },
  { name: "status", label: "Status", type: "select", options: TASK_STATUSES, required: true },
  { name: "due", label: "Termen", type: "datetime" },
  { name: "estimatedHours", label: "Ore estimate", type: "number" },
  { name: "actualHours", label: "Ore lucrate", type: "number" },
];

/** Câmpurile unei observații: proiect obligatoriu, prioritate și status liber. */
export const OBSERVATION_FIELDS: FieldDef[] = [
  { name: "title", label: "Titlu", type: "text", required: true },
  { name: "description", label: "Descriere", type: "textarea", span: 2 },
  { name: "projectId", label: "Proiect", type: "relation", endpoint: "/projects", required: true },
  { name: "priority", label: "Prioritate", type: "select", options: PRIORITIES },
  { name: "status", label: "Status", type: "text" },
];
