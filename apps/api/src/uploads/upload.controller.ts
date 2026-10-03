import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import {
  FileInterceptor,
} from '@nestjs/platform-express';

import 'multer';
import { UploadService } from './upload.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator.js';

@UseGuards(AuthGuard)
@Controller('uploads')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
  ) {}

  @Post('zip')
  @UseInterceptors(
    FileInterceptor('file', {
      dest: './uploads/tmp',
      limits: {
        fileSize: (Number(process.env.MAX_UPLOAD_SIZE_MB) || 100) * 1024 * 1024,
      },
    }),
  )
  uploadZip(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile()
    file?: Express.Multer.File,
    @Body()
    body?: { file?: string; zipPath?: string; filePath?: string },
  ) {
    const localPath = body?.file || body?.zipPath || body?.filePath;
    return this.uploadService.extractZip(file, localPath, user.id);
  }
}