import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Crea un archivo .env y completa su valor.`,
    );
  }

  return value;
}

export const env = {
  GITHUB_TOKEN: required("GITHUB_TOKEN"),
};