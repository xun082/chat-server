import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsISO8601,
  ValidateNested,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';

import { NotificationType } from '@/common/enum/notification-type.enum';

class MessageDto {
  @IsMongoId()
  @IsNotEmpty()
  senderId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsISO8601()
  @IsNotEmpty()
  createdAt: string;
}

export class CreateOfflineNotificationDto {
  @IsMongoId()
  @IsNotEmpty()
  receiverId: string;

  @ValidateNested()
  @Type(() => MessageDto)
  message: MessageDto;
}
