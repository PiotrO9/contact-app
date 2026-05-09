import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForUser(userId: string) {
    return this.prisma.contact.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  findDeletedForUser(userId: string) {
    return this.prisma.contact.findMany({
      where: { userId, deletedAt: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForUser(userId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  createForUser(userId: string, dto: CreateContactDto) {
    return this.prisma.contact.create({
      data: {
        userId,
        name: dto.name,
        email: dto.email || null,
        phone: dto.phone || null,
        note: dto.note || null,
      },
    });
  }

  async updateForUser(userId: string, id: string, dto: UpdateContactDto) {
    await this.findOneForUser(userId, id);

    return this.prisma.contact.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email || null }),
        ...(dto.phone !== undefined && { phone: dto.phone || null }),
        ...(dto.note !== undefined && { note: dto.note || null }),
        ...(dto.isFavorite !== undefined && { isFavorite: dto.isFavorite }),
      },
    });
  }

  async deleteForUser(userId: string, id: string) {
    await this.findOneForUser(userId, id);

    return this.prisma.contact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restoreForUser(userId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, userId, deletedAt: { not: null } },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return this.prisma.contact.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
