import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Types } from 'mongoose';

import { getCurrentTimestamp } from '@/utils';

export class FindUserByEmailDto {
  @IsEmail({}, { message: '无效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱地址不能为空' })
  @IsString({ message: 'email 必须为字符串' })
  email: string;
}

export class createUserDto extends FindUserByEmailDto {
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString({ message: '密码必须为字符串' })
  password: string;

  @IsNotEmpty({ message: '验证码不能为空' })
  @IsString({ message: '验证码必须为字符串' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: '确认密码不能为空' })
  confirm_password: string;
}

export class GithubUserDto {
  githubId: number;
  username: string;
  avatar: string;
  email: string;
}

export class UserDto {
  @ApiProperty({ description: '用户邮箱' })
  email: string;

  @ApiProperty({ description: '用户名' })
  username: string;

  @ApiProperty({ description: '用户头像', default: '1c902bf0-df6b-447f-bb9c-a257b014b1f5' })
  avatar: string;

  @ApiProperty({ description: '创建时间', default: getCurrentTimestamp })
  createdAt: number;

  @ApiProperty({ description: 'GitHub ID', default: 0 })
  githubId: number;

  @ApiProperty({ description: '用户 ID' })
  @Transform(({ value }) => value.toString())
  _id: Types.ObjectId;
}

export class GitHubAccessToken {
  @ApiProperty({ description: '用户邮箱' })
  access_token: string;

  @ApiProperty({ description: '用户名' })
  token_type: string;

  @ApiProperty({ description: '用户头像', default: '1c902bf0-df6b-447f-bb9c-a257b014b1f5' })
  scope: string;
}
