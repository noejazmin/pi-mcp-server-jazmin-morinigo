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

export const createRepositorySchema = z.object({
  name: z
    .string()
    .min(1, {
      message: "El nombre del repositorio es obligatorio.",
    })
    .max(100, {
      message:
        "El nombre no puede superar los 100 caracteres.",
    })
    .regex(/^[a-zA-Z0-9_.-]+$/, {
      message:
        "El nombre solo puede contener letras, números, puntos, guiones y guiones bajos.",
    })
    .describe("Nombre del nuevo repositorio."),

  description: z
    .string()
    .optional()
    .describe("Descripción opcional del repositorio."),

  private: z
    .boolean()
    .default(false)
    .describe("Indica si el repositorio será privado."),
});

export const createRepositoryOutputSchema = z.object({
  ok: z.literal(true),
  data: repositorySchema,
});

export type Repository = z.infer<typeof repositorySchema>;