import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface LineMessagePayload {
  to: string;
  messages: Array<{
    type: 'text' | 'flex';
    text?: string;
    altText?: string;
    contents?: object;
  }>;
}

@Injectable()
export class LineMessagingService {
  private readonly logger = new Logger(LineMessagingService.name);
  private readonly apiUrl = 'https://api.line.me/v2/bot/message/push';

  constructor(private readonly configService: ConfigService) {}

  /**
   * Send a push message to a specific LINE user
   * @param lineUserId - LINE User ID (from webhook when user adds bot)
   * @param message - Message to send
   */
  async sendPushMessage(lineUserId: string, message: string): Promise<boolean> {
    const channelAccessToken = this.configService.get<string>('LINE_CHANNEL_ACCESS_TOKEN');

    if (!channelAccessToken) {
      this.logger.warn('LINE_CHANNEL_ACCESS_TOKEN not configured');
      return false;
    }

    if (!lineUserId) {
      this.logger.warn('No LINE User ID provided');
      return false;
    }

    try {
      const payload: LineMessagePayload = {
        to: lineUserId,
        messages: [
          {
            type: 'text',
            text: message,
          },
        ],
      };

      await axios.post(this.apiUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${channelAccessToken}`,
        },
      });

      this.logger.log(`LINE message sent to: ${lineUserId.substring(0, 10)}...`);
      return true;
    } catch (error) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string }).response?.data
          ?.message || (error as Error).message;
      this.logger.error(`Failed to send LINE message: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Send a rich Flex Message for payment notification
   * @param lineUserId - LINE User ID
   * @param amount - Payment amount
   * @param customerName - Customer name
   * @param bookingNumber - Booking reference number
   */
  async sendPaymentNotification(
    lineUserId: string,
    amount: number,
    customerName: string,
    bookingNumber: string,
  ): Promise<boolean> {
    const channelAccessToken = this.configService.get<string>('LINE_CHANNEL_ACCESS_TOKEN');

    if (!channelAccessToken || !lineUserId) {
      return false;
    }

    try {
      const flexMessage = this.createPaymentFlexMessage(amount, customerName, bookingNumber);

      const payload: LineMessagePayload = {
        to: lineUserId,
        messages: [
          {
            type: 'flex',
            altText: `💰 ได้รับเงิน ${amount.toLocaleString()} บาท จาก ${customerName}`,
            contents: flexMessage,
          },
        ],
      };

      await axios.post(this.apiUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${channelAccessToken}`,
        },
      });

      this.logger.log(`Payment notification sent for booking: ${bookingNumber}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send payment notification: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Create a Flex Message bubble for payment notification
   */
  private createPaymentFlexMessage(
    amount: number,
    customerName: string,
    bookingNumber: string,
  ): object {
    return {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '💰 ได้รับเงินแล้ว!',
            weight: 'bold',
            size: 'lg',
            color: '#1DB446',
          },
        ],
        backgroundColor: '#F0FFF0',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `฿${amount.toLocaleString()}`,
            weight: 'bold',
            size: 'xxl',
            margin: 'md',
          },
          {
            type: 'separator',
            margin: 'xl',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'xl',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'ลูกค้า', size: 'sm', color: '#555555', flex: 2 },
                  {
                    type: 'text',
                    text: customerName,
                    size: 'sm',
                    color: '#111111',
                    flex: 4,
                    align: 'end',
                  },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'เลขบิล', size: 'sm', color: '#555555', flex: 2 },
                  {
                    type: 'text',
                    text: `#${bookingNumber}`,
                    size: 'sm',
                    color: '#111111',
                    flex: 4,
                    align: 'end',
                  },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'เวลา', size: 'sm', color: '#555555', flex: 2 },
                  {
                    type: 'text',
                    text: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
                    size: 'sm',
                    color: '#111111',
                    flex: 4,
                    align: 'end',
                  },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '✅ ยืนยันการชำระเงินแล้ว',
            size: 'xs',
            color: '#1DB446',
            align: 'center',
          },
        ],
      },
    };
  }

  /**
   * Format simple text payment notification
   */
  formatPaymentNotification(amount: number, customerName: string, bookingNumber: string): string {
    return `💰 ได้รับเงิน ${amount.toLocaleString()} บาท\n👤 จาก: ${customerName}\n📋 บิล: #${bookingNumber}\n✅ ยืนยันการชำระเงินแล้ว`;
  }
}
