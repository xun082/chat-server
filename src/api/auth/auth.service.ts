import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import {
  EmailLoginDto,
  LoginResponseDto,
  SendVerificationCodeDto,
  SendVerificationCodeResponseDto,
} from './dto/auto.dto';
import { UserService } from '../user/user.service';
import { UserDocument, User } from '../user/schema/user.schema';

import { RedisService } from '@/common/redis/redis.service';
import { EmailService } from '@/common/email/email.service';
import { ResponseDto } from '@/common/dto/response.dto';
import { LoginException } from '@/core/exceptions/login.exception';
import { generateDefaultPassword, generateVerificationCode } from '@/utils';
import { JwtPayload } from '@/common/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
    private readonly userService: UserService,
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async sendVerificationCode(
    data: SendVerificationCodeDto,
  ): Promise<ResponseDto<SendVerificationCodeResponseDto>> {
    const { account } = data;

    const verificationCode = generateVerificationCode();

    await this.redisService.set(account, verificationCode, 300);

    try {
      await this.emailService.sendMail(account, account, verificationCode);
    } catch (error) {
      throw new LoginException('发送验证码失败，请稍后再试。');
    }

    return {
      data: {
        status: 'success',
        expiresIn: 300,
      },
      message: '发送验证码成功',
    };
  }

  async emailLogin(data: EmailLoginDto): Promise<ResponseDto<LoginResponseDto>> {
    const { email, captcha } = data;

    // 1. 验证验证码是否有效
    const uniqueId = await this.redisService.get(email);

    if (uniqueId !== captcha) {
      throw new LoginException('验证码无效。');
    }

    // 2. 查找用户或创建新用户
    let userResult: JwtPayload | null = await this.userModel
      .findOne({ email })
      .select('_id email username')
      .lean()
      .exec();

    if (!userResult) {
      userResult = await this.createNewUser(email, captcha);
    } else {
      userResult._id = userResult._id.toString(); // 如果 _id 是 ObjectId，转换为字符串
    }

    // 3. 确保 userResult 和 email 存在
    if (!userResult || !userResult.email) {
      throw new Error('用户创建或查找失败');
    }

    // 4. 生成 Access Token 和 Refresh Token
    const tokens = this.generateTokens(userResult._id as string, userResult.email);

    // 5. 返回登录成功的响应
    return {
      data: {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expiresIn: 7 * 24 * 60 * 60, // 7 天的有效期
      },
      message: '登录成功',
    };
  }

  private async createNewUser(email: string, captcha: string) {
    const password = generateDefaultPassword();
    const newUser = await this.userService.createUserByEmail(
      {
        email,
        code: captcha,
        confirm_password: password,
        password: password,
      },
      true,
    );

    return {
      _id: newUser._id.toHexString(),
      email: newUser.email,
      username: newUser.username,
    };
  }

  private generateTokens(userId: string, email: string) {
    const accessToken = this.jwtService.sign({
      sub: userId,
      email: email,
    });

    const refreshToken = this.jwtService.sign({ sub: userId, email: email }, { expiresIn: '714d' });

    return { accessToken, refreshToken };
  }

  jwtVerify(token: string) {
    return this.jwtService.verify(token);
  }
}
