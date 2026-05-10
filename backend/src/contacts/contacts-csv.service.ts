import { BadRequestException, Injectable } from '@nestjs/common';
import { isEmail } from 'class-validator';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { ContactsService } from './contacts.service';

type CsvRecord = Record<string, string | undefined>;

export type ContactImportFailure = {
  row: number;
  reason: string;
};

export type ContactImportSummary = {
  imported: number;
  skipped: number;
  failed: ContactImportFailure[];
};

type ImportContactInput = {
  name: string;
  email: string;
  phone: string | null;
  note: string | null;
  relationship: string | null;
  isFavorite: boolean;
  labels: string[];
};

type ExportContact = {
  name: string;
  email: string | null;
  phone: string | null;
  note: string | null;
  relationship: string | null;
  isFavorite: boolean;
  labels: string[];
};

@Injectable()
export class ContactsCsvService {
  private readonly csvColumns = [
    'name',
    'email',
    'phone',
    'note',
    'relationship',
    'isFavorite',
    'labels',
  ];

  constructor(private readonly contactsService: ContactsService) {}

  exportContacts(contacts: ExportContact[]): string {
    return stringify(
      contacts.map((contact) => ({
        name: contact.name,
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        note: contact.note ?? '',
        relationship: contact.relationship ?? '',
        isFavorite: contact.isFavorite ? 'true' : 'false',
        labels: contact.labels.join(';'),
      })),
      {
        bom: true,
        columns: this.csvColumns,
        header: true,
      },
    );
  }

  async importContacts(
    userId: string,
    file: { buffer: Buffer },
  ): Promise<ContactImportSummary> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('CSV file is required');
    }

    const records = this.parseCsv(file.buffer);
    const summary: ContactImportSummary = {
      imported: 0,
      skipped: 0,
      failed: [],
    };

    for (const [index, record] of records.entries()) {
      const rowNumber = index + 2;
      const contact = this.toImportContact(record);

      if (!contact) {
        summary.skipped += 1;
        continue;
      }

      const validationError = this.validateImportContact(contact);

      if (validationError) {
        summary.failed.push({ row: rowNumber, reason: validationError });
        continue;
      }

      await this.contactsService.upsertImportedContactForUser(userId, contact);
      summary.imported += 1;
    }

    return summary;
  }

  private parseCsv(buffer: Buffer): CsvRecord[] {
    try {
      return parse(buffer.toString('utf8'), {
        bom: true,
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as CsvRecord[];
    } catch {
      throw new BadRequestException('Could not parse CSV file');
    }
  }

  private toImportContact(record: CsvRecord): ImportContactInput | null {
    const name = this.clean(record['name']);
    const email = this.clean(record['email']);
    const phone = this.cleanNullable(record['phone']);
    const note = this.cleanNullable(record['note']);
    const relationship = this.cleanNullable(record['relationship']);
    const isFavorite = this.parseBoolean(record['isFavorite']);
    const labels = this.parseLabels(record['labels']);

    if (
      !name &&
      !email &&
      !phone &&
      !note &&
      !relationship &&
      labels.length === 0
    ) {
      return null;
    }

    return {
      name,
      email,
      phone,
      note,
      relationship,
      isFavorite,
      labels,
    };
  }

  private validateImportContact(contact: ImportContactInput): string | null {
    if (!contact.name) {
      return 'Name is required';
    }

    if (!contact.email) {
      return 'Email is required';
    }

    if (!isEmail(contact.email)) {
      return 'Email is invalid';
    }

    return null;
  }

  private parseLabels(value: string | undefined): string[] {
    const seenLabels = new Set<string>();

    return (value ?? '')
      .split(';')
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

  private parseBoolean(value: string | undefined): boolean {
    return ['1', 'true', 'yes', 'tak'].includes(
      this.clean(value).toLowerCase(),
    );
  }

  private clean(value: string | undefined): string {
    return (value ?? '').trim();
  }

  private cleanNullable(value: string | undefined): string | null {
    const cleanValue = this.clean(value);

    return cleanValue || null;
  }
}
