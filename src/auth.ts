import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Rol } from "@/generated/prisma/enums";

const credencialesSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credencialesSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const usuario = await prisma.usuario.findUnique({
          where: { email: parsed.data.email },
        });
        if (!usuario || !usuario.activo) return null;

        const ok = await bcrypt.compare(parsed.data.password, usuario.passwordHash);
        if (!ok) return null;

        return {
          id: usuario.id,
          name: usuario.nombre,
          email: usuario.email,
          role: usuario.rol,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: Rol }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      if (token.role) session.user.role = token.role as Rol;
      return session;
    },
  },
});
