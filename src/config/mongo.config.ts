import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

import { MongoDbConfigEnum } from '../common/enum/config.enum';

export default (configService: ConfigService) => {
  const host = configService.get(MongoDbConfigEnum.MONGODB_HOST);
  const port = configService.get(MongoDbConfigEnum.MONGODB_PORT);
  const username = configService.get(MongoDbConfigEnum.MONGODB_USERNAME);
  const password = configService.get(MongoDbConfigEnum.MONGODB_PASSWORD);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const dbName = configService.get(MongoDbConfigEnum.MONGODB_DATABASE);
  const authSource = configService.get(MongoDbConfigEnum.MONGODB_AUTH_SOURCE);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const uri = `mongodb://${username}:${password}@${host}:${port}/?authSource=${authSource}`;
  const u = `mongodb://root:4vsnLAuNi8cukChuLpuX@dds-wz9afe5bc16479b4-pub.mongodb.rds.aliyuncs.com:3717/admin`;

  return {
    uri: u,
    retryAttempts: 2,
    dbName: 'online',
  } as MongooseModuleOptions;
};
