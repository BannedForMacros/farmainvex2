import type { DefaultSession } from "next-auth";
import type { Rol } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Rol;
    } & DefaultSession["user"];
  }

  interface User {
    role: Rol;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Rol;
  }
}
