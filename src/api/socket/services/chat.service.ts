import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Socket } from 'socket.io';

import { ChatHistory, ChatHistoryDocument, MessageType } from '../schema/chat-history.schema';
import { CreateChatHistoryDto } from '../dto/create-message.dto';
import { OfflineNotificationService } from './offline-notification.service';
import { CreateOfflineNotificationDto } from '../dto/offline-notification.dto';

import { NotificationType } from '@/common/enum/notification-type.enum';
import { SocketKeys } from '@/common/enum/socket';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatHistory.name) private chatHistoryModel: Model<ChatHistoryDocument>,
    private readonly offlineNotificationService: OfflineNotificationService,
  ) {}

  async create(createChatHistoryDto: CreateChatHistoryDto): Promise<ChatHistory> {
    const createdChatHistory = new this.chatHistoryModel(createChatHistoryDto);

    return createdChatHistory.save();
  }

  async findUnreadMessagesForUser(userId: string): Promise<ChatHistory[]> {
    return this.chatHistoryModel.find({ receiverId: userId, isRead: false }).exec();
  }

  async findMessagesForChatRoom(chatroomId: string): Promise<ChatHistory[]> {
    return this.chatHistoryModel.find({ chatroomId }).exec();
  }

  async markMessagesAsReadForUser(userId: string): Promise<void> {
    await this.chatHistoryModel.updateMany({ receiverId: userId, isRead: true }).exec();
  }

  async markMessagesAsReadForChatRoom(chatroomId: string): Promise<void> {
    await this.chatHistoryModel.updateMany({ chatroomId, isRead: true }).exec();
  }

  async handlePrivateMessage(
    data: { to: string; message: string; type: MessageType },
    userId: string,
    clients: Map<string, Socket>,
  ): Promise<void> {
    const targetClient = clients.get(data.to);

    // 存储消息
    await this.create({
      content: data.message,
      senderId: userId,
      receiverId: data.to,
      isRead: false,
      type: data.type,
    });

    if (targetClient) {
      targetClient.emit(SocketKeys.SINGLE_CHAT, {
        from: userId,
        message: data.message,
        type: data.type,
      });
    } else {
      const createOfflineNotificationDto: CreateOfflineNotificationDto = {
        receiverId: data.to,
        message: {
          senderId: userId,
          content: data.message,
          type: NotificationType.PRIVATE_MESSAGE,
          createdAt: new Date().toISOString(),
        },
      };
      await this.offlineNotificationService.saveOfflineNotification(createOfflineNotificationDto);
    }
  }
}
