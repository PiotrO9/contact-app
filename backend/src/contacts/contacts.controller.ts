import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AuthenticatedUserId } from '../auth/authenticated-user-id.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { ContactsCsvService } from './contacts-csv.service';
import { ContactsService } from './contacts.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Controller('contacts')
@UseGuards(SupabaseAuthGuard)
export class ContactsController {
  constructor(
    private readonly contactsCsvService: ContactsCsvService,
    private readonly contactsService: ContactsService,
  ) {}

  @Get()
  async findAll(@AuthenticatedUserId() userId: string) {
    return this.contactsService.findAllForUser(userId);
  }

  @Get(['trash', 'trash/items'])
  async findDeleted(@AuthenticatedUserId() userId: string) {
    return this.contactsService.findDeletedForUser(userId);
  }

  @Get('labels')
  async findLabels(@AuthenticatedUserId() userId: string) {
    return this.contactsService.findLabelsForUser(userId);
  }

  @Get('export.csv')
  async exportCsv(
    @AuthenticatedUserId() userId: string,
    @Res() response: Response,
  ) {
    const contacts = await this.contactsService.findAllForUser(userId);
    const csv = this.contactsCsvService.exportContacts(contacts);

    response
      .attachment('contacts.csv')
      .type('text/csv; charset=utf-8')
      .send(csv);
  }

  @Post('import.csv')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @UploadedFile() file: { buffer: Buffer },
    @AuthenticatedUserId() userId: string,
  ) {
    return this.contactsCsvService.importContacts(userId, file);
  }

  @Post('labels')
  async createLabel(
    @Body() createLabelDto: CreateLabelDto,
    @AuthenticatedUserId() userId: string,
  ) {
    return this.contactsService.createLabelForUser(userId, createLabelDto);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @AuthenticatedUserId() userId: string,
  ) {
    return this.contactsService.findOneForUser(userId, id);
  }

  @Post()
  async create(
    @Body() createContactDto: CreateContactDto,
    @AuthenticatedUserId() userId: string,
  ) {
    return this.contactsService.createForUser(userId, createContactDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
    @AuthenticatedUserId() userId: string,
  ) {
    return this.contactsService.updateForUser(userId, id, updateContactDto);
  }

  @Patch(':id/restore')
  async restore(
    @Param('id') id: string,
    @AuthenticatedUserId() userId: string,
  ) {
    return this.contactsService.restoreForUser(userId, id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @AuthenticatedUserId() userId: string) {
    return this.contactsService.deleteForUser(userId, id);
  }
}
