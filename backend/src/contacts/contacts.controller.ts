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
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Controller('contacts')
export class ContactsController {
  constructor(
    private readonly authService: AuthService,
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
