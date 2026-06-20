import { DashboardService } from './dashboard.service';

const makeLog = (calories: string, protein: string, carbs: string, fat: string) => ({
  calories,
  protein,
  carbs,
  fat,
});

describe('DashboardService', () => {
  it('aggregates log macros into actual totals', async () => {
    const logs = [makeLog('165', '31', '0', '3.6'), makeLog('80', '2', '15', '0.5')];
    const logsService = { list: jest.fn().mockResolvedValue(logs) } as any;
    const plansService = { forDate: jest.fn().mockResolvedValue(null) } as any;
    const targetsService = { get: jest.fn().mockResolvedValue(null) } as any;

    const service = new DashboardService(logsService, plansService, targetsService);
    const result = await service.get('user-1', '2026-06-20', 'Asia/Jerusalem');

    expect(result.actual).toEqual({ calories: '245', protein: '33', carbs: '15', fat: '4.1' });
    expect(result.remaining).toBeNull();
    expect(result.plan).toBeNull();
    expect(result.logs).toBe(logs);
  });

  it('returns zero actual totals with no logs', async () => {
    const logsService = { list: jest.fn().mockResolvedValue([]) } as any;
    const plansService = { forDate: jest.fn().mockResolvedValue(null) } as any;
    const targetsService = { get: jest.fn().mockResolvedValue(null) } as any;

    const service = new DashboardService(logsService, plansService, targetsService);
    const result = await service.get('user-1', '2026-06-20', 'Asia/Jerusalem');

    expect(result.actual).toEqual({ calories: '0', protein: '0', carbs: '0', fat: '0' });
  });

  it('calculates remaining when targets are set', async () => {
    const logs = [makeLog('100', '10', '5', '2')];
    const targets = { calories: '2000', protein: '150', carbs: '200', fat: '70' };
    const logsService = { list: jest.fn().mockResolvedValue(logs) } as any;
    const plansService = { forDate: jest.fn().mockResolvedValue(null) } as any;
    const targetsService = { get: jest.fn().mockResolvedValue(targets) } as any;

    const service = new DashboardService(logsService, plansService, targetsService);
    const result = await service.get('user-1', '2026-06-20', 'Asia/Jerusalem');

    expect(result.remaining).toEqual({ calories: '1900', protein: '140', carbs: '195', fat: '68' });
    expect(result.targets).toBe(targets);
  });

  it('includes plan from plans service', async () => {
    const plan = { id: 'plan-1', name: 'Day 1', date: '2026-06-20', items: [] };
    const logsService = { list: jest.fn().mockResolvedValue([]) } as any;
    const plansService = { forDate: jest.fn().mockResolvedValue(plan) } as any;
    const targetsService = { get: jest.fn().mockResolvedValue(null) } as any;

    const service = new DashboardService(logsService, plansService, targetsService);
    const result = await service.get('user-1', '2026-06-20', 'Asia/Jerusalem');

    expect(result.plan).toBe(plan);
    expect(plansService.forDate).toHaveBeenCalledWith('user-1', '2026-06-20');
  });
});
