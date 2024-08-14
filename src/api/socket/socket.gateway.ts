import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseFilters } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { ChatService } from './services/chat.service';
import { ConnectionService } from './services/connection.service';
import { MessageType } from './schema/chat-history.schema';
import { OfflineNotificationService } from './services/offline-notification.service';
import { CreateOfflineNotificationDto } from './dto/offline-notification.dto';

import { NotificationType } from '@/common/enum/notification-type.enum';
import { FriendRequestEvent } from '@/core/events/friend-request.events';
import { WebsocketExceptionsFilter } from '@/core/filter/WebsocketExceptions.filter';
import { SocketKeys } from '@/common/enum/socket';

@WebSocketGateway(81, {
  namespace: 'event',
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
    allowedHeaders: ['Authorization'],
  },
  transports: ['websocket'],
})
@UseFilters(WebsocketExceptionsFilter)
@Injectable()
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private clients: Map<string, Socket> = new Map();

  constructor(
    private readonly chatService: ChatService,
    private readonly connectionService: ConnectionService,
    private readonly offlineNotificationService: OfflineNotificationService,
  ) {}

  async handleConnection(client: Socket) {
    await this.connectionService.handleConnection(client);
  }

  async handleDisconnect(client: Socket): Promise<void> {
    await this.connectionService.handleDisconnect(client);
  }

  @SubscribeMessage(SocketKeys.SINGLE_CHAT)
  async handlePrivateMessage(
    @MessageBody() data: { to: string; message: string; type: MessageType },
    @ConnectedSocket() socket: Socket,
  ) {
    const user = socket.data.user;
    await this.chatService.handlePrivateMessage(data, user.id, this.clients);
  }

  @OnEvent(SocketKeys.FRIEND_REQUEST_CREATED)
  async handleFriendRequestEvent(event: FriendRequestEvent) {
    const receiverSocket = this.clients.get(event.receiverId.toHexString());

    if (receiverSocket) {
      receiverSocket.emit('notification', { type: 'friendRequest', data: event });
    } else {
      const createOfflineNotificationDto: CreateOfflineNotificationDto = {
        receiverId: event.receiverId,
        message: {
          senderId: event.senderId,
          content: 'You have a new friend request',
          type: NotificationType.FRIEND_REQUEST,
          createdAt: new Date().toISOString(),
        },
      };
      await this.offlineNotificationService.saveOfflineNotification(createOfflineNotificationDto);
    }
  }

  @OnEvent(SocketKeys.FRIEND_REQUEST_UPDATED)
  async handleFriendRequestUpdatedEvent(event: FriendRequestEvent) {
    await this.chatService.processFriendRequestUpdate(event, this.clients);
  }
}
