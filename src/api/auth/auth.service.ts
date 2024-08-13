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

    const uniqueId = await this.redisService.get(email);

    if (uniqueId !== captcha) {
      throw new LoginException('验证码无效。');
    }

    const password = generateDefaultPassword();
    const userResult = await this.userModel
      .findOne({ email: email })
      .select('_id email username')
      .lean()
      .exec();

    console.log(userResult, 2222);

    const user: JwtPayload =
      {
        _id: userResult?._id.toString(),
        email: userResult?.email,
        username: userResult?.username,
      } ??
      (await (async () => {
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
          _id: newUser._id.toString(),
          email: newUser.email,
          username: newUser.username,
        };
      })());

    if (!user || !user.email) {
      throw new Error('用户创建或查找失败');
    }

    // 2. 生成token时确保user.email存在
    const accessToken = this.jwtService.sign({ sub: user._id.toString(), email: user.email });
    const refreshToken = this.jwtService.sign(
      { sub: user._id.toString(), email: user.email },
      { expiresIn: '714d' },
    );

    return {
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expiresIn: 7 * 24 * 60 * 60,
      },
      message: '登录成功',
    };
  }

  jwtVerify(token: string) {
    return this.jwtService.verify(token);
  }
}
