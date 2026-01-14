import { Catch, RpcExceptionFilter, ArgumentsHost, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

interface RpcErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

@Catch(RpcException)
export class AllRpcExceptionFilter implements RpcExceptionFilter<RpcException> {
  private readonly logger = new Logger(AllRpcExceptionFilter.name);

  catch(exception: RpcException, _host: ArgumentsHost): Observable<RpcErrorResponse> {
    const error = exception.getError();

    let code: string;
    let message: string;
    let details: Record<string, unknown> | undefined;

    if (typeof error === 'string') {
      code = 'RPC_ERROR';
      message = error;
    } else if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>;
      code = (errorObj.code as string) || 'RPC_ERROR';
      message = (errorObj.message as string) || 'An error occurred';
      details = errorObj.details as Record<string, unknown>;
    } else {
      code = 'UNKNOWN_ERROR';
      message = 'An unknown error occurred';
    }

    this.logger.error(`RPC Exception: ${code} - ${message}`, exception.stack);

    const response: RpcErrorResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    };

    return throwError(() => response);
  }
}
