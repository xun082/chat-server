import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { getCurrentTimestamp } from '@/utils';

@Schema()
export class Friends {
  @Prop({ type: Types.ObjectId, required: true })
  user_id: Types.ObjectId; // 当前用户的ID

  @Prop({ type: Types.ObjectId, required: true })
  friend_id: Types.ObjectId; // 好友的用户ID

  @Prop({ default: getCurrentTimestamp })
  createAt: number;

  @Prop({ default: '' })
  remark: string; // 用户对好友的备注名
}

export const FriendsSchema = SchemaFactory.createForClass(Friends);
export type FriendsDocument = HydratedDocument<Friends>;
