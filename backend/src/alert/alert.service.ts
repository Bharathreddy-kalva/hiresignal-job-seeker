import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { WatchlistService } from '../watchlist/watchlist.service';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly watchlist: WatchlistService,
    private readonly config: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: this.config.get<string>('GMAIL_USER'),
        pass: this.config.get<string>('GMAIL_APP_PASSWORD'),
      },
    });
  }

  // Every Monday at 9 AM
  @Cron('0 9 * * 1')
  async sendWeeklyAlerts() {
    this.logger.log('Weekly alert job started');
    const grouped = await this.watchlist.getAllGroupedByEmail();
    for (const [email, companies] of grouped) {
      await this.sendAlertEmail(email, companies).catch((err: unknown) =>
        this.logger.error(`Failed to send alert to ${email}: ${String(err)}`),
      );
    }
    this.logger.log(`Weekly alerts sent to ${grouped.size} subscribers`);
  }

  private verdictLabel(score: number) {
    if (score >= 71) return 'Strong Signal ↑';
    if (score >= 41) return 'Moderate Signal →';
    return 'Weak Signal ↓';
  }

  private async sendAlertEmail(email: string, companies: string[]) {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const rows = await Promise.all(
      companies.map(async (company) => {
        const key = company.toLowerCase().trim();

        const current = await this.prisma.scoreHistory.findFirst({
          where: { companyName: key },
          orderBy: { createdAt: 'desc' },
        });

        const lastWeek = await this.prisma.scoreHistory.findFirst({
          where: { companyName: key, createdAt: { lte: oneWeekAgo } },
          orderBy: { createdAt: 'desc' },
        });

        const score    = current?.score ?? 0;
        const prevScore = lastWeek?.score ?? score;
        const delta    = score - prevScore;
        const arrow    = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
        const changeText = delta !== 0
          ? `${arrow} ${Math.abs(delta)} pts`
          : `→ no change`;

        return `
          <tr>
            <td style="padding:10px 14px;font-weight:600;color:#0f172a">${company}</td>
            <td style="padding:10px 14px;color:#2563eb;font-weight:700">${score}/100</td>
            <td style="padding:10px 14px;color:${delta > 0 ? '#16a34a' : delta < 0 ? '#dc2626' : '#64748b'}">${changeText}</td>
            <td style="padding:10px 14px;color:#64748b">${this.verdictLabel(score)}</td>
          </tr>`;
      }),
    );

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f8f9ff;margin:0;padding:32px">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">

    <div style="padding:24px 32px;border-bottom:1px solid #e2e8f0">
      <span style="color:#2563eb;font-weight:900;font-size:20px">HS.</span>
      <span style="color:#94a3b8;font-size:13px;margin-left:6px">HireSignal Weekly Update</span>
    </div>

    <div style="padding:24px 32px">
      <h2 style="color:#0f172a;font-size:18px;font-weight:700;margin:0 0 8px">
        Your watched companies this week
      </h2>
      <p style="color:#64748b;font-size:13px;margin:0 0 20px">
        Scores are updated daily. Here's how your companies are trending.
      </p>

      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="background:#f8f9ff">
            <th style="padding:10px 14px;text-align:left;color:#94a3b8;font-size:11px;letter-spacing:0.06em;font-weight:600;font-family:monospace">COMPANY</th>
            <th style="padding:10px 14px;text-align:left;color:#94a3b8;font-size:11px;letter-spacing:0.06em;font-weight:600;font-family:monospace">SCORE</th>
            <th style="padding:10px 14px;text-align:left;color:#94a3b8;font-size:11px;letter-spacing:0.06em;font-weight:600;font-family:monospace">CHANGE</th>
            <th style="padding:10px 14px;text-align:left;color:#94a3b8;font-size:11px;letter-spacing:0.06em;font-weight:600;font-family:monospace">SIGNAL</th>
          </tr>
        </thead>
        <tbody style="border-top:1px solid #e2e8f0">
          ${rows.join('')}
        </tbody>
      </table>
    </div>

    <div style="padding:16px 32px;background:#f8f9ff;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;text-align:center">
      Built by <em style="font-family:Georgia,serif">Bharath Reddy Kalva</em>
      &nbsp;·&nbsp;
      <a href="http://localhost:5173/watchlist" style="color:#2563eb;text-decoration:none">Manage watchlist</a>
    </div>

  </div>
</body>
</html>`;

    const gmailUser = this.config.get<string>('GMAIL_USER');
    await this.transporter.sendMail({
      from: `"HireSignal" <${gmailUser}>`,
      to: email,
      subject: 'HireSignal Weekly Update — Your Watched Companies',
      html,
    });
    this.logger.log(`Alert sent to ${email} for companies: ${companies.join(', ')}`);
  }
}
