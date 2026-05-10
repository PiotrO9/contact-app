import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { ContactsCsvService } from './contacts-csv.service';
import { ContactsService } from './contacts.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Controller('contacts')
export class ContactsController {
  constructor(
    private readonly authService: AuthService,
    private readonly contactsCsvService: ContactsCsvService,
    private readonly contactsService: ContactsService,
  ) {}

  @Get()
  async findAll(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userId = await this.authService.getAuthenticatedUserId(
      request,
      response,
    );

    return this.contactsService.findAllForUser(userId);
  }

  @Get(['trash', 'trash/items'])
  async findDeleted(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userId = await this.authService.getAuthenticatedUserId(
      request,
      response,
    );

    return this.contactsService.findDeletedForUser(userId);
  }

  @Get('labels')
  async findLabels(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userId = await this.authService.getAuthenticatedUserId(
      request,
      response,
    );

    return this.contactsService.findLabelsForUser(userId);
  }

  @Get('export.csv')
  async exportCsv(@Req() request: Request, @Res() response: Response) {
    const userId = await this.authService.getAuthenticatedUserId(
      request,
      response,
    );
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
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userId = await this.authService.getAuthenticatedUserId(
      request,
      response,
    );

    return this.contactsCsvService.importContacts(userId, file);
  }

  @Post('labels')
  async createLabel(
    @Body() createLabelDto: CreateLabelDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userId = await this.authService.getAuthenticatedUserId(
      request,
      response,
    );

    return this.contactsService.createLabelForUser(userId, createLabelDto);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userId = await this.authService.getAuthenticatedUserId(
      request,
      response,
    );

    return this.contactsService.findOneForUser(userId, id);
  }

  @Post()
  async create(
    @Body() createContactDto: CreateContactDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userId = await this.authService.getAuthenticatedUserId(
      request,
      response,
    );

    return this.contactsService.createForUser(userId, createContactDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userId = await this.authService.getAuthenticatedUserId(
      request,
      response,
    );

    return this.contactsService.updateForUser(userId, id, updateContactDto);
  }

  @Patch(':id/restore')
  async restore(
    @Param('id') id: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userId = await this.authService.getAuthenticatedUserId(
      request,
      response,
    );

    return this.contactsService.restoreForUser(userId, id);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userId = await this.authService.getAuthenticatedUserId(
      request,
      response,
    );

    return this.contactsService.deleteForUser(userId, id);
  }
}
