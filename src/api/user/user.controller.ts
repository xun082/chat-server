import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { UserService } from './user.service';
import {
  CreateFriendRequestDto,
  UpdateFriendRequestStatusDto,
} from './dto/send-friend-request.dto';
import { FindUserByEmailDto, UpdateUserDto, UserDto } from './dto/user.dto';

import { RequestWithUser } from '@/common/types';
import { ResponseDto } from '@/common/dto/response.dto';
import { ApiResponseWithDto } from '@/core/decorate/api-response.decorator';

@Controller('user')
@ApiTags('User')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: '获取登录用户信息' })
  @ApiResponseWithDto(UserDto, '获取登录用户信息', HttpStatus.OK)
  async getUserInfo(@Request() req: RequestWithUser): Promise<ResponseDto<UserDto>> {
    return await this.userService.getUserInfo(req.user._id);
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
    return await this.userService.getFriendRequests(req.user.email);
  }

  @Patch('friend/requests/:id')
  @ApiOperation({ summary: '更新好友请求状态' })
  async updateFriendRequestStatus(
    @Param('id') id: string,
    @Body() updateFriendRequestDto: UpdateFriendRequestStatusDto,
  ): Promise<ResponseDto<void>> {
    return await this.userService.updateFriendRequestStatus(id, updateFriendRequestDto);
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '根据邮箱搜索用户' })
  @ApiResponseWithDto(UserDto, '获取用户信息', HttpStatus.OK)
  async searchUserByEmail(
    @Query() query: FindUserByEmailDto,
  ): Promise<ResponseDto<UserDto | null>> {
    return await this.userService.findUserByEmail(query);
  }

  @Patch('update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改用户信息' })
  @ApiResponseWithDto(UpdateUserDto, '修改用户信息', HttpStatus.OK)
  async updateUserInfo(@Request() req: RequestWithUser, @Body() updateUserDto: UpdateUserDto) {
    return await this.userService.updateUserInfo(req.user._id, updateUserDto);
  }
}
