import { BadRequestException } from '@nestjs/common';
import { ContactsCsvService } from './contacts-csv.service';

jest.mock('./contacts.service', () => ({
  ContactsService: class ContactsService {},
}));

type MockContactsService = {
  upsertImportedContactForUser: jest.Mock;
};

describe('ContactsCsvService', () => {
  const contactsService = {
    upsertImportedContactForUser: jest.fn(),
  } satisfies MockContactsService;

  let service: ContactsCsvService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ContactsCsvService(contactsService as never);
  });

  it('exports contacts with labels in a semicolon-separated column', () => {
    const csv = service.exportContacts([
      {
        name: 'Jan Kowalski',
        email: 'jan@example.com',
        phone: '+48123123123',
        note: 'Likes CSV, safely',
        relationship: 'brat',
        isFavorite: true,
        labels: ['rodzina', 'praca'],
      },
    ]);

    expect(csv).toContain('name,email,phone,note,relationship,isFavorite,labels');
    expect(csv).toContain('"Likes CSV, safely"');
    expect(csv).toContain('rodzina;praca');
  });

  it('imports valid rows and reports invalid rows', async () => {
    contactsService.upsertImportedContactForUser.mockResolvedValue({} as never);

    const summary = await service.importContacts(
      'user-id',
      {
        buffer: Buffer.from(
          [
            'name,email,phone,note,relationship,isFavorite,labels',
            'Anna Nowak,anna@example.com,123,,siostra,tak,rodzina;VIP;rodzina',
            'No Email,,123,,,,',
          ].join('\n'),
        ),
      },
    );

    expect(summary).toEqual({
      imported: 1,
      skipped: 0,
      failed: [{ row: 3, reason: 'Email is required' }],
    });
    expect(contactsService.upsertImportedContactForUser).toHaveBeenCalledWith(
      'user-id',
      {
        name: 'Anna Nowak',
        email: 'anna@example.com',
        phone: '123',
        note: null,
        relationship: 'siostra',
        isFavorite: true,
        labels: ['rodzina', 'VIP'],
      },
    );
  });

  it('rejects empty uploads', async () => {
    await expect(
      service.importContacts('user-id', { buffer: Buffer.alloc(0) }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
