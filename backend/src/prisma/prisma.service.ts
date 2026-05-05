import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL);

    if (!connectionString) {
      throw new Error('DATABASE_URL is required to initialize Prisma');
    }

    super({
      adapter: new PrismaPg({ connectionString }),
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

function normalizeDatabaseUrl(connectionString?: string) {
  if (!connectionString) {
    return connectionString;
  }

  try {
    new URL(connectionString);
    return connectionString;
  } catch {
    const protocolSeparator = connectionString.indexOf('://');
    const credentialsSeparator = connectionString.lastIndexOf('@');

    if (protocolSeparator === -1 || credentialsSeparator === -1) {
      return connectionString;
    }

    const protocol = connectionString.slice(0, protocolSeparator + 3);
    const credentials = connectionString.slice(
      protocolSeparator + 3,
      credentialsSeparator,
    );
    const hostAndPath = connectionString.slice(credentialsSeparator + 1);
    const passwordSeparator = credentials.indexOf(':');

    if (passwordSeparator === -1) {
      return connectionString;
    }

    const username = credentials.slice(0, passwordSeparator);
    const password = credentials.slice(passwordSeparator + 1);

    return `${protocol}${encodeURIComponent(username)}:${encodeURIComponent(password)}@${hostAndPath}`;
  }
}
