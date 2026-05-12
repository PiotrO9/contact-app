import { ContactsService } from './contacts.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

type MockPrismaDelegate = Record<string, jest.Mock>;

type MockPrisma = {
  $transaction: jest.Mock;
  contact: MockPrismaDelegate;
  contactLabel: MockPrismaDelegate;
  label: MockPrismaDelegate;
};

const baseContact = {
  id: 'contact-id',
  userId: 'user-id',
  name: 'Anna Nowak',
  email: 'anna@example.com',
  phone: null,
  note: null,
  relationship: null,
  isFavorite: false,
  deletedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function createPrismaMock(): MockPrisma {
  const tx = {
    contact: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    contactLabel: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    label: {
      upsert: jest.fn(),
    },
  };

  return {
    ...tx,
    $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
}

describe('ContactsService', () => {
  let prisma: MockPrisma;
  let service: ContactsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    service = new ContactsService(prisma as never);
  });

  it('creates a contact with relationship, favorite flag, and labels atomically', async () => {
    prisma.contact.create.mockResolvedValue(baseContact);
    prisma.label.upsert
      .mockResolvedValueOnce({ id: 'label-family', name: 'family' })
      .mockResolvedValueOnce({ id: 'label-vip', name: 'VIP' });
    prisma.contactLabel.deleteMany.mockResolvedValue({ count: 0 });
    prisma.contactLabel.createMany.mockResolvedValue({ count: 2 });
    prisma.contact.findFirst.mockResolvedValue({
      ...baseContact,
      relationship: 'friend',
      isFavorite: true,
      labels: [{ label: { name: 'VIP' } }, { label: { name: 'family' } }],
    });

    const contact = await service.createForUser('user-id', {
      name: 'Anna Nowak',
      email: 'anna@example.com',
      relationship: 'friend',
      isFavorite: true,
      labels: [' family ', 'VIP', 'family'],
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.contact.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        name: 'Anna Nowak',
        email: 'anna@example.com',
        phone: null,
        note: null,
        relationship: 'friend',
        isFavorite: true,
      },
    });
    expect(prisma.label.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.contactLabel.deleteMany).toHaveBeenCalledWith({
      where: { contactId: 'contact-id' },
    });
    expect(prisma.contactLabel.createMany).toHaveBeenCalledWith({
      data: [
        { contactId: 'contact-id', labelId: 'label-family' },
        { contactId: 'contact-id', labelId: 'label-vip' },
      ],
      skipDuplicates: true,
    });
    expect(contact.labels).toEqual(['VIP', 'family']);
  });

  it('updates contact fields and replaces labels in one transaction', async () => {
    prisma.contact.findFirst
      .mockResolvedValueOnce(baseContact)
      .mockResolvedValueOnce({
        ...baseContact,
        name: 'Anna Updated',
        labels: [{ label: { name: 'work' } }],
      });
    prisma.contact.update.mockResolvedValue({
      ...baseContact,
      name: 'Anna Updated',
    });
    prisma.label.upsert.mockResolvedValue({ id: 'label-work', name: 'work' });
    prisma.contactLabel.deleteMany.mockResolvedValue({ count: 2 });
    prisma.contactLabel.createMany.mockResolvedValue({ count: 1 });

    const contact = await service.updateForUser('user-id', 'contact-id', {
      name: 'Anna Updated',
      labels: ['work'],
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.contact.update).toHaveBeenCalledWith({
      where: { id: 'contact-id' },
      data: { name: 'Anna Updated' },
    });
    expect(prisma.contactLabel.deleteMany).toHaveBeenCalledWith({
      where: { contactId: 'contact-id' },
    });
    expect(contact).toMatchObject({
      id: 'contact-id',
      name: 'Anna Updated',
      labels: ['work'],
    });
  });

  it('upserts imported contacts and syncs labels inside the import transaction', async () => {
    prisma.contact.findFirst
      .mockResolvedValueOnce({ id: 'existing-contact-id' })
      .mockResolvedValueOnce({
        ...baseContact,
        id: 'existing-contact-id',
        labels: [{ label: { name: 'imported' } }],
      });
    prisma.contact.update.mockResolvedValue({
      ...baseContact,
      id: 'existing-contact-id',
    });
    prisma.label.upsert.mockResolvedValue({
      id: 'label-imported',
      name: 'imported',
    });
    prisma.contactLabel.deleteMany.mockResolvedValue({ count: 1 });
    prisma.contactLabel.createMany.mockResolvedValue({ count: 1 });

    const contact = await service.upsertImportedContactForUser('user-id', {
      name: 'Anna Import',
      email: 'ANNA@example.com',
      phone: '123',
      note: null,
      relationship: 'sister',
      isFavorite: true,
      labels: ['imported'],
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.contact.findFirst).toHaveBeenNthCalledWith(1, {
      where: {
        userId: 'user-id',
        email: {
          equals: 'ANNA@example.com',
          mode: 'insensitive',
        },
        deletedAt: null,
      },
    });
    expect(prisma.contact.update).toHaveBeenCalledWith({
      where: { id: 'existing-contact-id' },
      data: {
        name: 'Anna Import',
        email: 'ANNA@example.com',
        phone: '123',
        note: null,
        relationship: 'sister',
        isFavorite: true,
      },
    });
    expect(contact).toMatchObject({
      id: 'existing-contact-id',
      labels: ['imported'],
    });
  });
});
