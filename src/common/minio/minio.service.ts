import { Inject, Injectable } from '@nestjs/common';
import * as Minio from 'minio';
import { MulterFile } from '@webundsoehne/nest-fastify-file-upload';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import sharp from 'sharp'; // 导入 sharp
import * as path from 'path';

import { MiNiOConfigEnum } from '../enum/config.enum';

@Injectable()
export class MinioService {
  constructor(
    @Inject('MINIO_CLIENT') private readonly minioClient: Minio.Client,
    protected configService: ConfigService,
  ) {}

  async getBuckets() {
    return await this.minioClient.listBuckets();
  }

  // 上传文件
  async uploadFile(file: MulterFile) {
    let buffer = file.buffer;
    let fileExtension = this.getFileExtension(file.originalname);

    // 检查文件类型，并转换为 WebP 格式
    if (file.mimetype.startsWith('image/')) {
      buffer = await sharp(buffer)
        .webp({ quality: 80 }) // 转换为 WebP 格式
        .toBuffer();
      fileExtension = 'webp'; // 设置新的文件扩展名
    }

    const etag = this.generateEtag(buffer);
    const fileName = `${etag}.${fileExtension}`; // 使用 etag 和后缀生成文件名

    await this.minioClient.putObject(
      this.configService.get(MiNiOConfigEnum.MINIO_BUCKET),
      fileName,
      buffer,
    );

    const expiry = 24 * 60 * 60;

    const presignedUrl = await this.minioClient.presignedUrl(
      'GET',
      this.configService.get(MiNiOConfigEnum.MINIO_BUCKET),
      fileName, // 使用完整文件名
      expiry,
    );

    return {
      url: presignedUrl,
    };
  }

  // 生成用于POST操作的预签名策略，适合多文件上传
  async generatePresignedPostPolicy(
    bucketName: string,
    fileName: string,
    expiry: number = 24 * 60 * 60,
  ) {
    const policy = new Minio.PostPolicy();
    policy.setBucket(bucketName);
    policy.setKey(fileName);
    policy.setExpires(new Date(Date.now() + expiry * 1000));

    const postPolicy = await this.minioClient.presignedPostPolicy(policy);

    return {
      postPolicy,
      url: `localhost/${bucketName}`, // 使用构建的 endpoint
    };
  }

  // 获取文件列表
  async listObjects(bucketName: string) {
    const stream = this.minioClient.listObjectsV2(bucketName, '', true);
    const objects = [];

    for await (const obj of stream) {
      objects.push(obj);
    }

    return objects;
  }

  // 获取文件
  async getFile(bucketName: string, fileName: string) {
    return await this.minioClient.getObject(bucketName, fileName);
  }

  // 删除文件
  async deleteFile(bucketName: string, fileName: string) {
    await this.minioClient.removeObject(bucketName, fileName);
  }

  private generateEtag(buffer: Buffer): string {
    const hash = createHash('md5'); // 使用 MD5 哈希算法
    hash.update(buffer);

    return hash.digest('hex'); // 以十六进制字符串形式返回哈希值
  }

  private getFileExtension(filename: string): string {
    return path.extname(filename).slice(1); // 提取文件后缀并去掉前面的点
  }
}
