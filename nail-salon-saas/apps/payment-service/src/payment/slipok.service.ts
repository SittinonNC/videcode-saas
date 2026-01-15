import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface SlipVerificationResult {
  success: boolean;
  data?: {
    transRef: string; // Transaction reference (unique per slip)
    date: string; // Transaction date
    amount: number; // Amount in THB
    sender: {
      name: string;
      bank: string;
    };
    receiver: {
      name: string;
      bank: string;
      accountNo: string;
    };
  };
  error?: string;
}

@Injectable()
export class SlipOkService {
  private readonly logger = new Logger(SlipOkService.name);
  private readonly apiUrl = 'https://api.slipok.com/api/line/apikey';

  constructor(private readonly configService: ConfigService) {}

  /**
   * Verify a payment slip using SlipOK API
   * @param imageBuffer - The slip image as a buffer
   * @returns Verification result with transaction details
   */
  async verifySlip(imageBuffer: Buffer): Promise<SlipVerificationResult> {
    const branchId = this.configService.get<string>('SLIPOK_BRANCH_ID');
    const apiKey = this.configService.get<string>('SLIPOK_API_KEY');

    if (!branchId || !apiKey) {
      this.logger.error('SlipOK credentials not configured');
      return {
        success: false,
        error: 'Slip verification service not configured',
      };
    }

    try {
      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');

      const response = await axios.post(
        `${this.apiUrl}/${branchId}`,
        {
          files: base64Image,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-authorization': apiKey,
          },
        },
      );

      const result = response.data;

      if (result.success) {
        return {
          success: true,
          data: {
            transRef: result.data.transRef,
            date: result.data.transDate,
            amount: parseFloat(result.data.amount),
            sender: {
              name: result.data.sender?.displayName || result.data.sender?.name || 'Unknown',
              bank: result.data.sendingBank || 'Unknown',
            },
            receiver: {
              name: result.data.receiver?.displayName || result.data.receiver?.name || 'Unknown',
              bank: result.data.receivingBank || 'Unknown',
              accountNo: result.data.receiver?.account?.value || '',
            },
          },
        };
      } else {
        this.logger.warn(`Slip verification failed: ${result.message}`);
        return {
          success: false,
          error: result.message || 'Slip verification failed',
        };
      }
    } catch (error) {
      this.logger.error(`SlipOK API error: ${(error as Error).message}`);
      return {
        success: false,
        error: 'Failed to verify slip. Please try again.',
      };
    }
  }

  /**
   * Validate slip data against expected values
   */
  validateSlipData(
    slipData: SlipVerificationResult['data'],
    expectedAmount: number,
    expectedReceiverName: string,
  ): { valid: boolean; reason?: string } {
    if (!slipData) {
      return { valid: false, reason: 'No slip data' };
    }

    // Check amount (allow 1 THB tolerance for rounding)
    if (Math.abs(slipData.amount - expectedAmount) > 1) {
      return {
        valid: false,
        reason: `ยอดเงินไม่ตรง: สลิป ${slipData.amount} บาท แต่ต้องจ่าย ${expectedAmount} บาท`,
      };
    }

    // Check receiver name (case-insensitive, partial match)
    const slipReceiverNormalized = slipData.receiver.name.toLowerCase().trim();
    const expectedReceiverNormalized = expectedReceiverName.toLowerCase().trim();

    if (
      !slipReceiverNormalized.includes(expectedReceiverNormalized) &&
      !expectedReceiverNormalized.includes(slipReceiverNormalized)
    ) {
      return {
        valid: false,
        reason: `ชื่อบัญชีปลายทางไม่ตรง: สลิปโอนไปบัญชี "${slipData.receiver.name}" แต่บัญชีร้านคือ "${expectedReceiverName}"`,
      };
    }

    return { valid: true };
  }
}
