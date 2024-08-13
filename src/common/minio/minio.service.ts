import { Inject, Injectable } from '@nestjs/common';
import * as Minio from 'minio';
import { MulterFile } from '@webundsoehne/nest-fastify-file-upload';

@Injectable()
export class MinioService {
  constructor(@Inject('MINIO_CLIENT') private readonly minioClient: Minio.Client) {}

  async getBuckets() {
    return await this.minioClient.listBuckets();
  }

  // 上传文件
  async uploadFile(bucketName: string, fileName: string, file: MulterFile) {
    await this.minioClient.putObject(bucketName, fileName, file.buffer);

    const expiry = 24 * 60 * 60;

    const presignedUrl = await this.minioClient.presignedUrl('GET', bucketName, fileName, expiry);

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
    const stream = await this.minioClient.listObjectsV2(bucketName, '', true);
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
}
