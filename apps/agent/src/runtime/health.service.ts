import {
  Injectable,
  Logger,
} from '@nestjs/common';

@Injectable()
export class HealthService {
  private readonly logger =
    new Logger(HealthService.name);

  async waitForHttp(
    port: number,
    timeoutMs = 600000,
  ): Promise<boolean> {
    return this.waitForHttpWithExitGuard(port, timeoutMs, () => false);
  }

  /**
   * Like waitForHttp but stops immediately if `isContainerExited()` returns
   * true. This prevents the agent from waiting the full timeout when a
   * container crashes or is OOM-killed during the build phase.
   */
  async waitForHttpWithExitGuard(
    port: number,
    timeoutMs = 600000,
    isContainerExited: () => boolean = () => false,
  ): Promise<boolean> {
    const start = Date.now();

    const url =
      `http://127.0.0.1:${port}`;

    this.logger.log(
      `Waiting for application: ${url}`,
    );

    while (
      Date.now() - start < timeoutMs
    ) {
      // Bail out immediately if the container has already exited
      if (isContainerExited()) {
        this.logger.warn(
          `Container exited while waiting for ${url} — stopping health check early.`,
        );
        // Give the exit watcher a moment to populate the reason
        await this.sleep(500);
        return false;
      }

      try {
        const response =
          await fetch(url, {
            method: 'GET',
            signal:
              AbortSignal.timeout(3000),
          });

        if (
          response.status >= 200 &&
          response.status < 400
        ) {
          this.logger.log(
            `Application healthy: ${url} (${response.status})`,
          );

          return true;
        }

        this.logger.debug(
          `Application responded with ${response.status}`,
        );
      } catch {
        const elapsed =
          Math.round(
            (Date.now() - start) / 1000,
          );

        if (
          elapsed % 10 === 0
        ) {
          this.logger.log(
            `Application not ready yet (${elapsed}s)...`,
          );
        }
      }

      await this.sleep(1000);
    }

    this.logger.error(
      `Application health check timed out after ${
        Math.round(timeoutMs / 1000)
      } seconds: ${url}`,
    );

    return false;
  }

  private sleep(
    ms: number,
  ) {
    return new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          ms,
        ),
    );
  }
}
