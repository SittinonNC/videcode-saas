import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/common';

import { StaffController } from './staff/staff.controller';
import { StaffService } from './staff/staff.service';
import { ServiceController } from './service/service.controller';
import { ServiceService } from './service/service.service';
import { CustomerController } from './customer/customer.controller';
import { CustomerService } from './customer/customer.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
  ],
  controllers: [StaffController, ServiceController, CustomerController],
  providers: [StaffService, ServiceService, CustomerService],
})
export class CoreModule {}
