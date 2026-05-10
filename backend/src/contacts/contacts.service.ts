import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

type ImportedContactDto = {
  name: string;
  email: string;
  phone: string | null;
  note: string | null;
  relationship: string | null;
  isFavorite: boolean;
  labels: string[];
};

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForUser(userId: string) {
    return this.prisma.contact
      .findMany({
        where: { userId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: this.contactLabelsInclude,
      })
      .then((contacts) =>
        contacts.map((contact) => this.toContactResponse(contact)),
      );
  }

  findLabelsForUser(userId: string) {
    return this.prisma.label.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  createLabelForUser(userId: string, dto: CreateLabelDto) {
    const name = dto.name.trim();

    return this.prisma.label.upsert({
      where: {
        userId_name: {
          userId,
          name,
        },
      },
      create: {
        userId,
        name,
      },
      update: {},
    });
  }

  private readonly contactLabelsInclude = {
    labels: {
      include: {
        label: true,
      },
    },
  } as const;

  private toContactResponse<
    T extends {
      labels?: Array<{
        label: {
          name: string;
        };
      }>;
    },
  >(contact: T) {
    const labels =
      contact.labels?.map((contactLabel) => contactLabel.label.name).sort() ??
      [];
    const { labels: _contactLabels, ...contactData } = contact;

    return { ...contactData, labels };
  }

  private normalizeLabels(labels: string[]) {
    const seenLabels = new Set<string>();

    return labels
      .map((label) => label.trim())
      .filter((label) => {
        const normalizedLabel = label.toLowerCase();

        if (!label || seenLabels.has(normalizedLabel)) {
          return false;
        }

        seenLabels.add(normalizedLabel);
        return true;
      });
  }

  private async syncLabelsForContact(
    userId: string,
    contactId: string,
    labels: string[],
  ) {
    const normalizedLabels = this.normalizeLabels(labels);

    const labelRecords = await Promise.all(
      normalizedLabels.map((name) =>
        this.prisma.label.upsert({
          where: {
            userId_name: {
              userId,
              name,
            },
          },
          create: {
            userId,
            name,
          },
          update: {},
        }),
      ),
    );

    await this.prisma.contactLabel.deleteMany({
      where: { contactId },
    });

    if (labelRecords.length === 0) {
      return;
    }

    await this.prisma.contactLabel.createMany({
      data: labelRecords.map((label) => ({
        contactId,
        labelId: label.id,
      })),
      skipDuplicates: true,
    });
  }

  findDeletedForUser(userId: string) {
    return this.prisma.contact
      .findMany({
        where: { userId, deletedAt: { not: null } },
        orderBy: { createdAt: 'desc' },
        include: this.contactLabelsInclude,
      })
      .then((contacts) =>
        contacts.map((contact) => this.toContactResponse(contact)),
      );
  }

  async findOneForUser(userId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, userId, deletedAt: null },
      include: this.contactLabelsInclude,
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return this.toContactResponse(contact);
  }

  createForUser(userId: string, dto: CreateContactDto) {
    return this.prisma.contact
      .create({
        data: {
          userId,
          name: dto.name,
          email: dto.email || null,
          phone: dto.phone || null,
          note: dto.note || null,
        },
        include: this.contactLabelsInclude,
      })
      .then((contact) => this.toContactResponse(contact));
  }

  async upsertImportedContactForUser(userId: string, dto: ImportedContactDto) {
    const existingContact = await this.prisma.contact.findFirst({
      where: {
        userId,
        email: {
          equals: dto.email,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
    });

    const contact = existingContact
      ? await this.prisma.contact.update({
          where: { id: existingContact.id },
          data: {
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            note: dto.note,
            relationship: dto.relationship,
            isFavorite: dto.isFavorite,
          },
          include: this.contactLabelsInclude,
        })
      : await this.prisma.contact.create({
          data: {
            userId,
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            note: dto.note,
            relationship: dto.relationship,
            isFavorite: dto.isFavorite,
          },
          include: this.contactLabelsInclude,
        });

    await this.syncLabelsForContact(userId, contact.id, dto.labels);

    return this.findOneForUser(userId, contact.id);
  }

  async updateForUser(userId: string, id: string, dto: UpdateContactDto) {
    await this.findOneForUser(userId, id);

    await this.prisma.contact.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email || null }),
        ...(dto.phone !== undefined && { phone: dto.phone || null }),
        ...(dto.note !== undefined && { note: dto.note || null }),
        ...(dto.relationship !== undefined && {
          relationship: dto.relationship || null,
        }),
        ...(dto.isFavorite !== undefined && { isFavorite: dto.isFavorite }),
      },
    });

    if (dto.labels !== undefined) {
      await this.syncLabelsForContact(userId, id, dto.labels);
    }

    return this.findOneForUser(userId, id);
  }

  async deleteForUser(userId: string, id: string) {
    await this.findOneForUser(userId, id);

    return this.prisma.contact
      .update({
        where: { id },
        data: { deletedAt: new Date() },
        include: this.contactLabelsInclude,
      })
      .then((contact) => this.toContactResponse(contact));
  }

  async restoreForUser(userId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, userId, deletedAt: { not: null } },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return this.prisma.contact
      .update({
        where: { id },
        data: { deletedAt: null },
        include: this.contactLabelsInclude,
      })
      .then((contact) => this.toContactResponse(contact));
  }
}
