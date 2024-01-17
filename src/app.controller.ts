import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      dest: 'uploads',
    }),
  )
  uploadFiles(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: { name: string },
  ) {
    console.log('body', body);
    console.log('files', files);

    // 用正则匹配出文件名
    const fileName = body.name.match(/(.+)\-\d+$/)[1];
    const chunkDir = 'uploads/chunks_' + fileName;

    // 在 uploads 下创建 chunks_文件名 的目录，把文件复制过去，然后删掉原始文件。
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir);
    }
    fs.cpSync(files[0].path, chunkDir + '/' + body.name);
    fs.rmSync(files[0].path);
  }

  @Get('merge')
  merge(@Query('name') name: string) {
    const chunkDir = 'uploads/chunks_' + name;

    let count = 0;
    const files = fs.readdirSync(chunkDir);
    // 全部分片上传完之后，发送合并分片的请求
    // 接收文件名，然后查找对应的 chunks 目录，把下面的文件读取出来，按照不同的 start 位置写入到同一个文件里。
    let startPos = 0;
    files.forEach((file) => {
      const filePath = chunkDir + '/' + file;
      const stream = fs.createReadStream(filePath);
      stream
        .pipe(
          fs.createWriteStream('uploads/' + name, {
            start: startPos,
          }),
        )
        .on('finish', () => {
          count++;
          // 合并完成之后把 chunks 目录删掉。
          if (count === files.length) {
            fs.rm(
              chunkDir,
              {
                recursive: true,
              },
              () => {
                console.log('remove chunkDir successfully!');
              },
            );
          }
        });

      startPos += fs.statSync(filePath).size;
    });
  }
}
