import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async send(
    pushToken: string | null,
    title: string,
    body: string,
    data?: object,
  ) {
    if (!pushToken) return; // user hasn't registered a device, or notifications not enabled

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: pushToken,
          title,
          body,
          data,
          sound: 'default',
        }),
      });

      const result = await response.json();
      if (result.data?.status === 'error') {
        this.logger.warn(`Push failed: ${result.data.message}`);
      }
    } catch (err) {
      this.logger.error('Failed to send push notification', err);
    }
  }
}
