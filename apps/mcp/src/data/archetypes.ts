import { createRequire } from "module";
import { z } from "zod";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const rawData = require(path.join(__dirname, "../../../../data/archetypes.json"));

const ArchetypeSchema = z.object({
  nombre: z.string(),
  branch_level_1: z.string(),
  sub_branch: z.string().nullable().optional(),
  descripcion: z.string(),
  disc_quadrant: z.string(),
  voss_type: z.string(),
  ekman_emotion: z.string(),
  ekman_signal: z.string(),
  ocean_base: z.record(z.number()),
  primary_fear: z.string(),
  sparring_style: z.string(),
  entry_point: z.string(),
  blind_spot: z.string(),
  close_signal: z.string(),
  key_lever: z.string(),
  batna_awareness: z.string(),
  institutional_context_prior: z.record(z.number()),
  demo_responses: z.array(z.any()).optional().default([]),
  keywords: z.array(z.string()).optional().default([]),
});

export type Archetype = z.infer<typeof ArchetypeSchema>;

export const ARCHETYPES: Archetype[] = rawData.archetypes.map((a: unknown) =>
  ArchetypeSchema.parse(a)
);

export const ARCHETYPE_NAMES = ARCHETYPES.map((a) => a.nombre);

export function archetypeByName(nombre: string): Archetype | undefined {
  return ARCHETYPES.find((a) => a.nombre === nombre);
}
