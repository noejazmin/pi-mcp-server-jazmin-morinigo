import { z } from "zod";

export const listRepositoriesSchema = z.object({
  type: z
    .enum(["all", "public", "private"])
    .default("all")
    .describe("Tipo de repositorios que se desean listar."),

  sort: z
    .enum(["created", "updated", "pushed", "full_name"])
    .default("updated")
    .describe("Criterio utilizado para ordenar los repositorios."),

  per_page: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(30)
    .describe("Cantidad de repositorios a devolver, entre 1 y 100."),
});

export const repositorySchema = z.object({
  fullName: z.string(),
  url: z.string().url(),
  private: z.boolean(),
  description: z.string().nullable(),
  owner: z.string(),
});

export const listRepositoriesOutputSchema = z.object({
  ok: z.literal(true),
  data: z.array(repositorySchema),
});

export type Repository = z.infer<typeof repositorySchema>;