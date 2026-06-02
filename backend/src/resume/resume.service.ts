import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as mammoth from 'mammoth';
// pdf-parse is CJS-only; use require() so nodenext module resolution is happy
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;

export interface ResumeParseResult {
  skills: string[];
  jobTitles: string[];
  yearsOfExperience: number;
}

const KNOWN_SKILLS = [
  'Java', 'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js',
  'NestJS', 'Spring Boot', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
  'Docker', 'Kubernetes', 'AWS', 'Git', 'GraphQL', 'REST',
  'Microservices', 'CI/CD', 'Jenkins', 'Linux', 'C++', 'C', 'SQL',
];

const JOB_TITLE_PATTERNS = [
  /Software\s+Engineer/gi,
  /Software\s+Developer/gi,
  /Frontend\s+Developer/gi,
  /Backend\s+Developer/gi,
  /Full[- ]Stack\s+Developer/gi,
  /Senior\s+Engineer/gi,
  /Lead\s+Engineer/gi,
  /Engineering\s+Manager/gi,
  /DevOps\s+Engineer/gi,
  /Data\s+Engineer/gi,
  /Product\s+Manager/gi,
  /\bIntern\b/gi,
];

// Matches: "Jan 2020 - Dec 2022", "2018 – 2021", "June 2019 – Present"
const DATE_RANGE_RE =
  /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?(\d{4})\s*[-–—]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?(\d{4}|[Pp]resent|[Cc]urrent)/g;

@Injectable()
export class ResumeService {
  private readonly logger = new Logger(ResumeService.name);

  async parse(file: Express.Multer.File): Promise<ResumeParseResult> {
    const text = await this.extractText(file);
    return {
      skills: this.parseSkills(text),
      jobTitles: this.parseJobTitles(text),
      yearsOfExperience: this.parseYearsOfExperience(text),
    };
  }

  private async extractText(file: Express.Multer.File): Promise<string> {
    const name = file.originalname.toLowerCase();
    const mime = file.mimetype;

    if (mime === 'application/pdf' || name.endsWith('.pdf')) {
      try {
        const result = await pdfParse(file.buffer);
        return result.text;
      } catch (err: unknown) {
        this.logger.warn(`pdf-parse failed: ${err instanceof Error ? err.message : String(err)}`);
        throw new BadRequestException('Failed to parse PDF. The file may be corrupted or password-protected.');
      }
    }

    if (
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      name.endsWith('.docx')
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        return result.value;
      } catch (err: unknown) {
        this.logger.warn(`mammoth failed: ${err instanceof Error ? err.message : String(err)}`);
        throw new BadRequestException('Failed to parse DOCX. The file may be corrupted.');
      }
    }

    throw new BadRequestException('Unsupported file type. Please upload a PDF or DOCX file.');
  }

  private parseSkills(text: string): string[] {
    const found: string[] = [];
    for (const skill of KNOWN_SKILLS) {
      // Escape special chars (C++, Node.js) and use word boundaries
      const escaped = skill.replace(/[+.]/g, (c) => `\\${c}`);
      const pattern = new RegExp(`(?<![\\w.])${escaped}(?![\\w.])`, 'i');
      if (pattern.test(text)) found.push(skill);
    }
    return found;
  }

  private parseJobTitles(text: string): string[] {
    const found = new Set<string>();
    for (const pattern of JOB_TITLE_PATTERNS) {
      const matches = text.match(pattern);
      if (matches) matches.slice(0, 2).forEach((m) => found.add(m.trim()));
    }
    return [...found].slice(0, 5);
  }

  private parseYearsOfExperience(text: string): number {
    const currentYear = new Date().getFullYear();
    let totalMonths = 0;
    let match: RegExpExecArray | null;
    const re = new RegExp(DATE_RANGE_RE.source, 'g');

    while ((match = re.exec(text)) !== null) {
      const start = parseInt(match[1], 10);
      const endRaw = match[2];
      const end = /present|current/i.test(endRaw) ? currentYear : parseInt(endRaw, 10);

      if (start >= 1990 && end >= start && end <= currentYear + 1) {
        totalMonths += (end - start) * 12;
      }
    }

    return Math.round(totalMonths / 12);
  }
}
