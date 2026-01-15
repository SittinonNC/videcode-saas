import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  Inject,
  Logger,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { Public, SERVICES, TENANT_PATTERNS, LinkLineUserDto } from '@app/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

interface LineWebhookEvent {
  type: 'follow' | 'unfollow' | 'message' | 'postback';
  replyToken?: string;
  source: {
    type: 'user' | 'group' | 'room';
    userId: string;
  };
  timestamp: number;
  message?: {
    type: string;
    id: string;
    text?: string;
  };
}

interface LineWebhookBody {
  destination: string;
  events: LineWebhookEvent[];
}

@ApiTags('LINE')
@Controller('line')
export class LineController {
  private readonly logger = new Logger(LineController.name);

  constructor(
    @Inject(SERVICES.AUTH) private readonly authClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {}

  /**
   * LINE Webhook - receives events from LINE Platform
   * Must be publicly accessible (no auth required)
   */
  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'LINE Webhook - receives events from LINE Platform' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(@Req() req: RawBodyRequest<Request>, @Body() body: LineWebhookBody) {
    // Verify webhook signature
    const signature = req.headers['x-line-signature'] as string;
    const channelSecret = this.configService.get<string>('LINE_CHANNEL_SECRET');

    if (channelSecret && signature) {
      const rawBody = req.rawBody;
      if (rawBody) {
        const expectedSignature = crypto
          .createHmac('sha256', channelSecret)
          .update(rawBody)
          .digest('base64');

        if (signature !== expectedSignature) {
          this.logger.warn('Invalid LINE webhook signature');
          return { success: false, error: 'Invalid signature' };
        }
      }
    }

    // Process events
    for (const event of body.events) {
      this.logger.log(`LINE event received: ${event.type} from ${event.source.userId}`);

      if (event.type === 'follow') {
        // User added the LINE OA as friend
        await this.handleFollowEvent(event);
      } else if (event.type === 'message' && event.message?.type === 'text') {
        // Handle text messages - can be used for linking accounts
        await this.handleMessageEvent(event);
      }
    }

    return { success: true };
  }

  /**
   * Handle follow event - when user adds LINE OA as friend
   * For now, just log the userId. In production, this would be linked to a tenant.
   */
  private async handleFollowEvent(event: LineWebhookEvent) {
    const userId = event.source.userId;
    this.logger.log(`New LINE follower: ${userId}`);

    // In production, you would:
    // 1. Send a welcome message asking for their email/shop code
    // 2. Once they reply, link their userId to their Tenant
    // For now, we just log it
  }

  /**
   * Handle message event - can be used for account linking
   */
  private async handleMessageEvent(event: LineWebhookEvent) {
    const userId = event.source.userId;
    const text = event.message?.text || '';
    this.logger.log(`Message from ${userId}: ${text}`);

    // If message looks like a shop code (e.g., "LINK:shop-a")
    if (text.startsWith('LINK:')) {
      const subdomain = text.replace('LINK:', '').trim().toLowerCase();
      await this.linkUserToTenant(userId, subdomain);
    }
  }

  /**
   * Link a LINE userId to a tenant by subdomain
   */
  private async linkUserToTenant(userId: string, subdomain: string) {
    try {
      await firstValueFrom(
        this.authClient.send(TENANT_PATTERNS.UPDATE_BY_SUBDOMAIN, {
          subdomain,
          data: { lineUserId: userId },
        }),
      );
      this.logger.log(`Linked LINE user ${userId} to tenant ${subdomain}`);
    } catch (error) {
      this.logger.error(`Failed to link LINE user: ${(error as Error).message}`);
    }
  }

  /**
   * Redirect to add LINE OA as friend
   * Shop owners can use this link to add the LINE OA
   */
  @Public()
  @Get('connect')
  @ApiOperation({ summary: 'Redirect to add LINE OA as friend' })
  @ApiQuery({ name: 'subdomain', required: false, description: 'Shop subdomain for auto-linking' })
  @ApiResponse({ status: 302, description: 'Redirect to LINE OA' })
  async connect(@Query('subdomain') subdomain: string, @Res() res: Response) {
    const lineOaId = this.configService.get<string>('LINE_OA_ID');

    if (!lineOaId) {
      return res.status(500).json({ error: 'LINE OA ID not configured' });
    }

    // LINE friend add URL with optional liff state
    const lineAddFriendUrl = `https://line.me/R/ti/p/${lineOaId}`;

    // If subdomain is provided, we could append it as a LIFF state
    // For now, just redirect to add friend
    return res.redirect(lineAddFriendUrl);
  }

  /**
   * Manual link endpoint - for testing or manual linking
   */
  @Public()
  @Post('link')
  @ApiOperation({ summary: 'Manually link LINE userId to a tenant' })
  @ApiBody({ type: LinkLineUserDto })
  @ApiResponse({ status: 200, description: 'Link result' })
  async manualLink(@Body() body: LinkLineUserDto) {
    try {
      await firstValueFrom(
        this.authClient.send(TENANT_PATTERNS.UPDATE_BY_SUBDOMAIN, {
          subdomain: body.subdomain,
          data: { lineUserId: body.lineUserId },
        }),
      );
      return { success: true, message: `Linked ${body.lineUserId} to ${body.subdomain}` };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}
