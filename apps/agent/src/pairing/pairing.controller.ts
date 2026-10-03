import {
  BadRequestException,
  Body,
  Controller,
  Get,
  GoneException,
  Post,
} from '@nestjs/common';
import { PairingService } from './pairing.service';

@Controller('agent')
export class PairingController {
  constructor(private readonly pairing: PairingService) {}

  @Get('status')
  status() {
    return this.pairing.getStatus();
  }

  @Post('pair')
  async pair(@Body() body: { code?: string; name?: string }) {
    try {
      return await this.pairing.pairWithCode(body?.code || '', body?.name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Pairing failed';
      // The upstream API returns 410 for invalid/expired/used codes; surface the
      // same status through the local agent instead of collapsing to 500.
      if (/invalid|expired|already used/i.test(msg)) {
        throw new GoneException(msg);
      }
      if (/6-digit|pairing code is required/i.test(msg)) {
        throw new BadRequestException(msg);
      }
      throw err;
    }
  }

  @Post('heartbeat')
  heartbeat() {
    return this.pairing.sendHeartbeat(true);
  }

  /** Force an immediate runtime reconciliation with the DeployX API. */
  @Post('sync')
  sync() {
    return this.pairing.syncRuntime(true);
  }

  @Post('unpair')
  unpair() {
    return this.pairing.unpair();
  }
}
