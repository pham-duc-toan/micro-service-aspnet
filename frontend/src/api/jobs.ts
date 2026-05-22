import { gatewayClient } from './axios';
import type { ScheduleEmailInput } from '@/types';

export async function scheduleEmail(input: ScheduleEmailInput): Promise<string> {
  const { data } = await gatewayClient.post<string>('/schedule-job/send-email', input);
  return data;
}

export async function deleteJob(jobId: string): Promise<boolean> {
  const { data } = await gatewayClient.delete<boolean>(
    `/schedule-job/delete/jobId/${encodeURIComponent(jobId)}`,
  );
  return data;
}

export async function welcomeJob(action: 'welcome' | 'delayedwelcome' | 'welcomeat' | 'confirmedwelcome'): Promise<unknown> {
  const { data } = await gatewayClient.post(`/welcome/${action}`);
  return data;
}
