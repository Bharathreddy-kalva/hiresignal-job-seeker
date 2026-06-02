import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResumeService } from './resume.service';

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

@Controller('resume')
export class ResumeController {
  constructor(private readonly resume: ResumeService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: undefined, // use memory storage (buffer)
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (_req, file, cb) => {
        const ok =
          ALLOWED_MIME.has(file.mimetype) ||
          /\.(pdf|docx)$/i.test(file.originalname);
        if (ok) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException('Only PDF and DOCX files are supported'),
            false,
          );
        }
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    return this.resume.parse(file);
  }
}
