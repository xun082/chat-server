import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { UserService } from './user.service';
import {
  CreateFriendRequestDto,
  UpdateFriendRequestStatusDto,
} from './dto/send-friend-request.dto';

import { RequestWithUser } from '@/common/types';
import { ResponseDto } from '@/common/dto/response.dto';

@Controller('user')
@ApiTags('User')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: '获取用户信息' })
  getUserInfo(@Request() req: RequestWithUser) {
    return this.userService.getUserInfo(req.user.username);
  }

  @Post('friend/request')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '发送好友请求' })
  async sendFriendRequest(
    @Body() sendFriendRequestDto: CreateFriendRequestDto,
  ): Promise<ResponseDto<void>> {
    return await this.userService.sendFriendRequest(sendFriendRequestDto);
  }

  @Get('friend/requests')
  @ApiOperation({ summary: '获取好友请求' })
  async getFriendRequests(@Request() req: RequestWithUser) {
    return this.userService.getFriendRequests(req.user.email);
  }

  @Patch('friend/requests/:id')
  @ApiOperation({ summary: '更新好友请求状态' })
  async updateFriendRequestStatus(
    @Param('id') id: string,
    @Body() updateFriendRequestDto: UpdateFriendRequestStatusDto,
  ): Promise<ResponseDto<void>> {
    return this.userService.updateFriendRequestStatus(id, updateFriendRequestDto);
  }
}
