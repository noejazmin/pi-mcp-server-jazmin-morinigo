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

export const repoSummarySchema = z.object({
  fullName: z.string(),
  description: z.string().nullable(),
  stars: z.number().int().nonnegative(),
  defaultBranch: z.string(),
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

export const createIssueSchema = z.object({
  owner: z
    .string()
    .min(1, {
      message: "El propietario es obligatorio.",
    })
    .describe(
      "Usuario u organización propietaria del repositorio.",
    ),

  repo: z
    .string()
    .min(1, {
      message: "El repositorio es obligatorio.",
    })
    .describe("Nombre del repositorio."),

  title: z
    .string()
    .min(3, {
      message:
        "El título debe tener al menos 3 caracteres.",
    })
    .describe("Título del issue."),

  body: z
    .string()
    .optional()
    .describe("Descripción opcional del issue en Markdown."),
});

export const createdIssueSchema = z.object({
  number: z.number().int().positive(),
  url: z.string().url(),
  title: z.string(),
});

export const createIssueOutputSchema = z.object({
  ok: z.literal(true),
  data: createdIssueSchema,
});

export const listIssuesSchema = z.object({
  owner: z
    .string()
    .min(1, {
      message: "El propietario es obligatorio.",
    })
    .describe(
      "Usuario u organización propietaria del repositorio.",
    ),

  repo: z
    .string()
    .min(1, {
      message: "El repositorio es obligatorio.",
    })
    .describe("Nombre del repositorio."),

  state: z
    .enum(["open", "closed", "all"])
    .default("open")
    .describe("Estado de los issues que se desean listar."),

  per_page: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(30)
    .describe(
      "Cantidad de issues a devolver, entre 1 y 100.",
    ),
});

export const issueSummarySchema = z.object({
  number: z.number().int().positive(),
  title: z.string(),
  state: z.string(),
  url: z.string().url(),
});

export const listIssuesOutputSchema = z.object({
  ok: z.literal(true),
  data: z.array(issueSummarySchema),
});

export const listCommitsSchema = z.object({
  owner: z
    .string()
    .min(1, {
      message: "El propietario es obligatorio.",
    })
    .describe(
      "Usuario u organización propietaria del repositorio.",
    ),

  repo: z
    .string()
    .min(1, {
      message: "El repositorio es obligatorio.",
    })
    .describe("Nombre del repositorio."),

  branch: z
    .string()
    .min(1, {
      message: "La rama no puede estar vacía.",
    })
    .default("main")
    .describe(
      "Rama cuyos commits se desean listar.",
    ),

  per_page: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(10)
    .describe(
      "Cantidad de commits a devolver, entre 1 y 100.",
    ),
});

export const commitSummarySchema = z.object({
  sha: z.string(),
  message: z.string(),
  author: z.string(),
  date: z.string().datetime().nullable(),
  url: z.string().url(),
});

export const listCommitsOutputSchema = z.object({
  ok: z.literal(true),
  data: z.array(commitSummarySchema),
});

export const createCommitSchema = z.object({
  owner: z
    .string()
    .min(1, {
      message: "El propietario es obligatorio.",
    })
    .describe(
      "Usuario u organización propietaria del repositorio.",
    ),

  repo: z
    .string()
    .min(1, {
      message: "El repositorio es obligatorio.",
    })
    .describe("Nombre del repositorio."),

  path: z
    .string()
    .min(1, {
      message: "La ruta del archivo es obligatoria.",
    })
    .describe(
      "Ruta del archivo relativa a la raíz, por ejemplo src/index.ts.",
    ),

  content: z
    .string()
    .describe("Contenido completo del archivo en UTF-8."),

  message: z
    .string()
    .min(1, {
      message: "El mensaje del commit es obligatorio.",
    })
    .describe("Mensaje que describe el commit."),

  branch: z
    .string()
    .min(1)
    .default("main")
    .describe("Rama donde se creará el commit."),
});

export const createdCommitSchema = z.object({
  sha: z.string(),
  url: z.string().url(),
  path: z.string(),
  branch: z.string(),
});

export const createCommitOutputSchema = z.object({
  ok: z.literal(true),
  data: createdCommitSchema,
});

export const addCommentToIssueSchema = z.object({
  owner: z
    .string()
    .min(1, {
      message: "El propietario es obligatorio.",
    })
    .describe(
      "Usuario u organización propietaria del repositorio.",
    ),

  repo: z
    .string()
    .min(1, {
      message: "El repositorio es obligatorio.",
    })
    .describe("Nombre del repositorio."),

  issue_number: z
    .number()
    .int()
    .positive({
      message:
        "El número del issue debe ser un entero positivo.",
    })
    .describe(
      "Número del issue donde se agregará el comentario.",
    ),

  body: z
    .string()
    .min(1, {
      message: "El comentario no puede estar vacío.",
    })
    .max(65536, {
      message:
        "El comentario no puede superar los 65536 caracteres.",
    })
    .describe(
      "Contenido en Markdown del comentario que se agregará al issue.",
    ),
});

export const issueCommentSchema = z.object({
  id: z.number().int().positive(),
  issueNumber: z.number().int().positive(),
  body: z.string(),
  author: z.string(),
  url: z.string().url(),
  createdAt: z.string().datetime(),
});

export const addCommentToIssueOutputSchema = z.object({
  ok: z.literal(true),
  data: issueCommentSchema,
});

export const closeIssueSchema = z.object({
  owner: z
    .string()
    .min(1, {
      message: "El propietario es obligatorio.",
    })
    .describe(
      "Usuario u organización propietaria del repositorio.",
    ),

  repo: z
    .string()
    .min(1, {
      message: "El repositorio es obligatorio.",
    })
    .describe("Nombre del repositorio."),

  issue_number: z
    .number()
    .int()
    .positive({
      message:
        "El número del issue debe ser un entero positivo.",
    })
    .describe(
      "Número del issue que se desea cerrar.",
    ),
});

export const closedIssueSchema = z.object({
  number: z.number().int().positive(),
  title: z.string(),
  state: z.literal("closed"),
  url: z.string().url(),
  closedAt: z.string().datetime().nullable(),
});

export const closeIssueOutputSchema = z.object({
  ok: z.literal(true),
  data: closedIssueSchema,
});

export type Repository = z.infer<typeof repositorySchema>;
export type CreatedIssue = z.infer<typeof createdIssueSchema>;
export type RepoSummary = z.infer<typeof repoSummarySchema>;
export type IssueSummary = z.infer<typeof issueSummarySchema>;
export type CreatedCommit = z.infer<typeof createdCommitSchema>;
export type CommitSummary = z.infer<typeof commitSummarySchema>;
export type IssueComment = z.infer<typeof issueCommentSchema>;
export type ClosedIssue = z.infer<typeof closedIssueSchema>;

