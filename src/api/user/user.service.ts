import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as argon2 from 'argon2';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { plainToInstance } from 'class-transformer';

import { User, UserDocument } from './schema/user.schema';
import { FindUserByEmailDto, UpdateUserDto, UserDto, createUserDto } from './dto/user.dto';
import {
  CreateFriendRequestDto,
  FriendRequestDto,
  UpdateFriendRequestStatusDto,
} from './dto/send-friend-request.dto';
import { FriendRequest, FriendRequestDocument } from './schema/friend-request.schema';
import { Friends, FriendsDocument } from './schema/friends.schema';

import { FriendRequestEvent } from '@/core/events/friend-request.events';
import { RedisService } from '@/common/redis/redis.service';
import { ValidationException } from '@/core/exceptions/validation.exception';
import { ResponseDto } from '@/common/dto/response.dto';
import { SocketKeys } from '@/common/enum/socket';
import { getCurrentTimestamp } from '@/utils';
import { FriendRequestStatus } from '@/common/types';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(FriendRequest.name) private friendRequestModel: Model<FriendRequestDocument>,
    @InjectModel(Friends.name) private friendModel: Model<FriendsDocument>,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getUserInfo(userId: string): Promise<ResponseDto<UserDto>> {
    const data = (await this.userModel
      .findOne({ _id: userId })
      .select('-password')
      .lean()
      .exec()) as ResponseDto<UserDto>;

    return data;
  }

  async findUserByEmail({ email }: FindUserByEmailDto): Promise<ResponseDto<UserDto | null>> {
    const data = (await this.userModel
      .findOne({ email })
      .select('-password')
      .lean()
      .exec()) as ResponseDto<UserDto>;

    if (data) {
      return data;
    }

    return null;
  }

  async createUserByEmail(data: createUserDto, isLoginType?: boolean) {
    const { email, code, password, confirm_password } = data;

    // 检查密码和确认密码是否匹配
    if (password !== confirm_password) {
      throw new ValidationException('Passwords do not match');
    }

    // 加密密码
    const passwordEncryption = await argon2.hash(password);

    // 如果是登录类型，直接创建新用户
    if (isLoginType) {
      return await this.createAndSaveUser(email, passwordEncryption, 'moment');
    }

    // 检查验证码是否匹配
    const uniqueId = await this.redisService.get(email);

    if (uniqueId !== code) {
      throw new ValidationException('Verification code is incorrect');
    }

    // 查找是否已有用户
    const existingUser = await this.userModel.findOne({ email }).lean().exec();

    // 如果没有找到用户，创建新用户
    if (!existingUser) {
      await this.createAndSaveUser(email, passwordEncryption, 'moment');
    }
  }

  private async createAndSaveUser(email: string, password: string, username: string) {
    const user = new this.userModel({
      email,
      password,
      username,
    });

    await user.save();

    return user;
  }

  // 发送好友申请
  async sendFriendRequest(
    senderId: string,
    createFriendRequestDto: CreateFriendRequestDto,
  ): Promise<ResponseDto<void>> {
    console.log(senderId);

    const { receiverId } = createFriendRequestDto;

    // 检查要申请的用户是否存在
    const senderExists = await this.userModel.exists({ _id: receiverId });

    if (!senderExists) {
      throw new ValidationException('申请的用户不存在');
    }

    // 检查发送者和接收者是否已经是好友
    const existingFriendship = await this.friendModel
      .findOne({ user_id: senderId, friend_id: receiverId })
      .exec();

    if (existingFriendship) {
      throw new ValidationException('You are already friends with this user');
    }

    // 检查是否已经存在未处理的好友请求
    const existingRequest = await this.friendRequestModel
      .findOne({
        senderId,
        receiverId,
      })
      .exec();

    if (existingRequest) {
      // 更新现有的好友请求
      existingRequest.description = createFriendRequestDto.description;
      existingRequest.createdAt = getCurrentTimestamp();
      await existingRequest.save();

      this.eventEmitter.emit(SocketKeys.FRIEND_REQUEST_UPDATED, new FriendRequestEvent());
    } else {
      // 创建新的好友请求
      const friendRequest = new this.friendRequestModel({
        senderId: senderId,
        ...createFriendRequestDto,
      });
      await friendRequest.save();

      this.eventEmitter.emit(SocketKeys.FRIEND_REQUEST_CREATED, new FriendRequestEvent());
    }

    return;
  }

  async getFriendRequests(userId: string): Promise<ResponseDto<FriendRequestDto[]>> {
    const data = await this.friendRequestModel
      .find({ $or: [{ senderId: userId }, { receiverId: userId }] })
      .select('-__v')
      .lean()
      .exec();

    const result = plainToInstance(FriendRequestDto, data, {
      enableImplicitConversion: true,
    });

    return { data: result };
  }

  // 通过好友验证
  async updateFriendRequestStatus(
    requestId: string,
    updateFriendRequestDto: UpdateFriendRequestStatusDto,
  ): Promise<ResponseDto<void>> {
    const friendRequest = await this.friendRequestModel.findOne({ senderId: requestId }).exec();

    if (!friendRequest) {
      throw new ValidationException('Friend request not found');
    }

    // 检查状态是否合理
    if (friendRequest.status !== FriendRequestStatus.PENDING) {
      throw new ValidationException('Friend request is not pending');
    }

    await this.friendRequestModel.findOneAndUpdate(
      { senderId: requestId },
      updateFriendRequestDto,
      {
        new: true,
      },
    );

    const friend = new this.friendModel({
      user_id: requestId,
      friend_id: friendRequest.receiverId,
    });

    await friend.save();

    this.eventEmitter.emit(SocketKeys.FRIEND_REQUEST_UPDATED, new FriendRequestEvent());

    return;
  }

  // 修改用户信息
  async updateUserInfo(userId: string, updateUserDto: UpdateUserDto): Promise<void> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: updateUserDto }, // 使用 $set 只更新传递的字段
        { new: true, runValidators: true }, // new: true 返回更新后的文档，runValidators: true 运行更新的验证器
      )
      .exec();

    if (!updatedUser) {
      throw new ValidationException('User not found');
    }

    return;
  }
}
