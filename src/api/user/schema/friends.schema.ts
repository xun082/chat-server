import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { getCurrentTimestamp } from '@/utils';

@Schema()
export class Friends {
  @Prop({ type: Types.ObjectId, required: true })
  user_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  friend_id: Types.ObjectId;

  @Prop({ default: getCurrentTimestamp })
  createAt: number;
}

export const FriendsSchema = SchemaFactory.createForClass(Friends);
export type FriendsDocument = HydratedDocument<Friends>;
