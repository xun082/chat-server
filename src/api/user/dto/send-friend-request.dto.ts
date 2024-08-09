import { IsEnum, IsMongoId, IsOptional, IsString, Length } from 'class-validator';

import { FriendRequestStatus } from '../schema/friend-request.schema';

export class CreateFriendRequestDto {
  @IsMongoId({ message: 'Invalid sender ID' })
  senderId: string;

  @IsMongoId({ message: 'Invalid receiver ID' })
  receiverId: string;

  @IsString()
  @Length(10, 500, { message: 'Description must be between 10 and 500 characters' })
  description: string;

  @IsOptional()
  @IsString()
  @Length(0, 100, { message: 'Remark must be less than 100 characters' })
  remark?: string; // 可选字段：备注信息
}

export class UpdateFriendRequestStatusDto {
  @IsEnum(FriendRequestStatus, { message: 'Invalid status' })
  status: FriendRequestStatus;
}
