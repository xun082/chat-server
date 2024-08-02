import { IsEmail, IsEnum, IsMongoId, IsString, Length } from 'class-validator';

import { FriendRequestStatus } from '../schema/friend-request.schema';

export class CreateFriendRequestDto {
  @IsMongoId({ message: 'Invalid sender ID' })
  senderId: string;

  @IsMongoId({ message: 'Invalid receiver ID' })
  receiverId: string;

  @IsString()
  @Length(10, 500, { message: 'Description must be between 10 and 500 characters' })
  description: string;
}

export class UpdateFriendRequestStatusDto {
  @IsEnum(FriendRequestStatus, { message: 'Invalid status' })
  status: FriendRequestStatus;
}
