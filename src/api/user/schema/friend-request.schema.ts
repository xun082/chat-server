import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import { getCurrentTimestamp } from '@/utils';

export enum FriendRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Schema()
export class FriendRequest {
  @Prop({ type: Types.ObjectId, required: true })
  senderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  receiverId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [500, 'Description must be at most 500 characters long'],
  })
  description: string;

  @Prop({ type: Number, default: getCurrentTimestamp })
  createdAt: number;

  @Prop({ type: String, enum: FriendRequestStatus, default: FriendRequestStatus.PENDING })
  status: FriendRequestStatus;
}

export type FriendRequestDocument = FriendRequest & Document;
export const FriendRequestSchema = SchemaFactory.createForClass(FriendRequest);
