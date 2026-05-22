import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { deleteJob, scheduleEmail, welcomeJob } from '@/api/jobs';
import Spinner from '@/components/ui/Spinner';
import { extractErrorMessage } from '@/api/axios';
import type { ScheduleEmailInput } from '@/types';

interface EmailForm extends ScheduleEmailInput {}

export default function JobsManage() {
  const [history, setHistory] = useState<Array<{ id: string; label: string; ts: string }>>([]);
  const [jobIdToDelete, setJobIdToDelete] = useState('');

  const emailForm = useForm<EmailForm>({
    defaultValues: {
      email: 'customer1@local.com',
      subject: 'Nhắc nhở giỏ hàng',
      content: 'Bạn còn giỏ hàng chưa thanh toán trên TeduShop.',
      enqueue: new Date(Date.now() + 5 * 60_000).toISOString().slice(0, 16),
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: (v: EmailForm) =>
      scheduleEmail({
        email: v.email,
        subject: v.subject,
        content: v.content,
        enqueue: new Date(v.enqueue).toISOString(),
      }),
    onSuccess: (jobId) => {
      toast.success(`Đã lên lịch job: ${jobId}`);
      setHistory((h) => [
        { id: String(jobId), label: 'Email job', ts: new Date().toLocaleTimeString('vi-VN') },
        ...h,
      ]);
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const deleteJobMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: (result) => {
      if (result) {
        toast.success('Đã hủy job');
      } else {
        toast(`API trả về false (job có thể không tồn tại).`, { icon: 'ℹ️' });
      }
      setJobIdToDelete('');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const welcomeMutation = useMutation({
    mutationFn: (action: 'welcome' | 'delayedwelcome' | 'welcomeat' | 'confirmedwelcome') =>
      welcomeJob(action),
    onSuccess: (_, action) => {
      toast.success(`Đã enqueue: ${action}`);
      setHistory((h) => [
        { id: action, label: `Welcome — ${action}`, ts: new Date().toLocaleTimeString('vi-VN') },
        ...h,
      ]);
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Tác vụ nền (Hangfire)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold mb-3">Lên lịch gửi email</h2>
          <form
            onSubmit={emailForm.handleSubmit((v) => scheduleMutation.mutate(v))}
            className="space-y-3"
          >
            <div>
              <label className="label">Email người nhận</label>
              <input
                type="email"
                className="input"
                {...emailForm.register('email', { required: true })}
              />
            </div>
            <div>
              <label className="label">Tiêu đề</label>
              <input className="input" {...emailForm.register('subject', { required: true })} />
            </div>
            <div>
              <label className="label">Nội dung</label>
              <textarea
                rows={3}
                className="input"
                {...emailForm.register('content', { required: true })}
              />
            </div>
            <div>
              <label className="label">Thời gian thực thi (UTC)</label>
              <input
                type="datetime-local"
                className="input"
                {...emailForm.register('enqueue', { required: true })}
              />
            </div>
            <button
              type="submit"
              disabled={scheduleMutation.isPending}
              className="btn-primary w-full"
            >
              {scheduleMutation.isPending ? <Spinner size="sm" className="text-white" /> : 'Lên lịch'}
            </button>
          </form>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold mb-3">Welcome jobs (demo)</h2>
          <div className="grid grid-cols-2 gap-2">
            {(['welcome', 'delayedwelcome', 'welcomeat', 'confirmedwelcome'] as const).map(
              (action) => (
                <button
                  key={action}
                  onClick={() => welcomeMutation.mutate(action)}
                  disabled={welcomeMutation.isPending}
                  className="btn-outline text-sm capitalize"
                >
                  {action}
                </button>
              ),
            )}
          </div>

          <h2 className="font-semibold mt-6 mb-3">Hủy job theo ID</h2>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="JobId..."
              value={jobIdToDelete}
              onChange={(e) => setJobIdToDelete(e.target.value)}
            />
            <button
              onClick={() => jobIdToDelete && deleteJobMutation.mutate(jobIdToDelete)}
              disabled={!jobIdToDelete || deleteJobMutation.isPending}
              className="btn-danger"
            >
              {deleteJobMutation.isPending ? <Spinner size="sm" className="text-white" /> : 'Hủy'}
            </button>
          </div>
        </div>
      </div>

      <div className="card p-5 mt-6">
        <h2 className="font-semibold mb-3">Lịch sử tác vụ trong phiên</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có tác vụ nào trong phiên này.</p>
        ) : (
          <ul className="divide-y divide-gray-100 text-sm">
            {history.map((h, idx) => (
              <li key={`${h.id}-${idx}`} className="py-2 flex justify-between">
                <span>
                  <span className="text-gray-500">{h.ts}</span>{' '}
                  <span className="font-medium">{h.label}</span>
                </span>
                <code className="text-xs text-gray-600">{h.id}</code>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
