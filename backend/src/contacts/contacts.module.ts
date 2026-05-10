import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContactsCsvService } from './contacts-csv.service';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

@Module({
  imports: [AuthModule],
  controllers: [ContactsController],
  providers: [ContactsCsvService, ContactsService],
})
export class ContactsModule {}
