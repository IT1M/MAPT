import { UserRole } from '@prisma/client';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      lastLogin?: Date | null;
      lastLoginIp?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    role: UserRole;
    lastLogin?: Date | null;
    lastLoginIp?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    lastLogin?: Date | null;
    lastLoginIp?: string | null;
  }
}
