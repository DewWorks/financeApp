import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/cron/backup/route';

// Mocks
const sendMailMock = vi.fn().mockResolvedValue(true);
const createTransportMock = vi.fn().mockReturnValue({
    sendMail: sendMailMock
});

// Mock modules
vi.mock('nodemailer', () => ({
    createTransport: createTransportMock,
    default: { createTransport: createTransportMock } // Handle default export if needed
}));

vi.mock('@/db/connectionDb', () => ({
    getMongoClient: vi.fn().mockResolvedValue({
        db: () => ({
            collection: (name: string) => ({
                find: () => ({
                    toArray: vi.fn().mockResolvedValue([{ id: 1, data: 'test' }])
                })
            })
        })
    })
}));

describe('Backup Cron Route (Phase 2)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Since the route uses `await import('nodemailer')`, we rely on Vitest hoisting or need to mock the import specifically if it wasn't global.
        // But for standard `vi.mock`, it should work if the runtime resolution hits the mock.
    });

    it('should fetch data and send email with attachments', async () => {
        const req = new Request('http://localhost/api/cron/backup');
        const res = await GET(req);

        expect(res.status).toBe(200);

        // Verify Email Sent
        expect(createTransportMock).toHaveBeenCalled();
        expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
            subject: expect.stringContaining('FinanceApp Backup'),
            attachments: expect.arrayContaining([
                expect.objectContaining({ filename: expect.stringContaining('users_backup') }),
                expect.objectContaining({ filename: expect.stringContaining('transactions_backup') })
            ])
        }));
    });
});
