"use server";

import { signIn, signOut } from "@/auth";

export async function cerrarSesion() {
  await signOut({ redirectTo: "/login" });
}

export interface EstadoLogin {
  error?: string;
}

export async function iniciarSesion(
  _prev: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
    return {};
  } catch (error) {
    // NextAuth lanza un redirect interno cuando el login es exitoso.
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { error: "Credenciales inválidas. Verifica tu correo y contraseña." };
  }
}
