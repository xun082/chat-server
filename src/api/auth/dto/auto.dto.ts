import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendVerificationCodeDto {
  @ApiProperty({
    example: '2042204285@qq.com',
    description: 'The account to send verification code to',
  })
  @IsNotEmpty({ message: '邮箱地址不能为空' })
  @IsString({ message: '事件必须是字符串' })
  account: string;
}

export class VerificationResponseDto {
  @ApiProperty({ example: 'some-uuid', description: 'The verification ID' })
  verificationId: string;
}

export class GitHubCallbackDto {
  @ApiProperty({
    example: '123',
    description: 'The account to send verification code to',
  })
  @IsNotEmpty({ message: '邮箱地址不能为空' })
  @IsString({ message: '事件必须是字符串' })
  code: string;
}

export class UserDto {
  githubId: number;
  username: string;
  avatarUrl: string;
  gravatarId: string;
  url: string;
  htmlUrl: string;
  followersUrl: string;
  followingUrl: string;
  gistsUrl: string;
  starredUrl: string;
  subscriptionsUrl: string;
  organizationsUrl: string;
  reposUrl: string;
  eventsUrl: string;
  receivedEventsUrl: string;
  type: string;
  siteAdmin: boolean;
  name: string;
  company: string;
  blog: string;
  location: string;
  email: string;
  hireable: string;
  bio: string;
  twitterUsername: string;
  publicRepos: number;
  publicGists: number;
  followers: number;
  following: number;
  createdAt: Date;
  updatedAt: Date;
}
