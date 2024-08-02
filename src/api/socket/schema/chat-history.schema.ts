import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { getCurrentTimestamp } from '@/utils';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  FILE = 'file',
}

@Schema()
export class ChatHistory {
  @Prop({ required: true })
  content: string;

  @Prop({ type: String, ref: 'User', required: true })
  senderId: string;

  @Prop({ type: String, ref: 'User' })
  receiverId?: string; // 单聊接收者的用户ID

  @Prop({ type: String, ref: 'ChatRoom' })
  chatroomId?: string; // 群聊ID

  @Prop({ default: getCurrentTimestamp })
  sendTime: number;

  @Prop({ default: getCurrentTimestamp })
  updateTime: number;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ required: true, enum: MessageType })
  type: MessageType; // 消息类型
}

export const ChatHistorySchema = SchemaFactory.createForClass(ChatHistory);
export type ChatHistoryDocument = HydratedDocument<ChatHistory>;
