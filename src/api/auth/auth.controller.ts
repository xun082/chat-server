import { Body, Controller, Get, HttpCode, Post, Query, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';

import { AuthService } from './auth.service';
import {
  LoginResponseDto,
  SendVerificationCodeDto,
  SendVerificationCodeResponseDto,
} from './dto/auto.dto';
import { EmailLoginDto } from './dto/auto.dto';

import { ApiResponseWithDto } from '@/core/decorate/api-response.decorator';
import { ResponseDto } from '@/common/dto/response.dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send')
  @HttpCode(200)
  @ApiOperation({ summary: '发送邮箱验证码' })
  @ApiResponseWithDto(SendVerificationCodeDto, '发送验证码')
  @ApiBody({ type: SendVerificationCodeDto })
  async sendVerificationCode(
    @Body() sendVerificationCodeDto: SendVerificationCodeDto,
  ): Promise<ResponseDto<SendVerificationCodeResponseDto>> {
    return this.authService.sendVerificationCode(sendVerificationCodeDto);
  }

  @Post('login/email')
  @HttpCode(200)
  @ApiOperation({ summary: '邮箱验证码登录' })
  @ApiResponseWithDto(SendVerificationCodeDto, '发送验证码')
  @ApiBody({ description: '邮箱验证码登录', type: EmailLoginDto, required: true })
  emailLogin(@Body() loginDto: EmailLoginDto): Promise<ResponseDto<LoginResponseDto>> {
    return this.authService.emailLogin(loginDto);
  }
}
