import { describe, it, expect } from '@jest/globals';
import { summarizeWorkload } from '../src/tempo/workloadSummary.js';
import { validate, schemas } from '../src/middleware/validation.js';

const options = {
  from: '2026-01-05', to: '2026-01-11', timezone: 'America/Argentina/Buenos_Aires',
  weekStartsOn: 'monday', dailyThresholdHours: 8, weeklyThresholdHours: 40,
};

describe('team workload summary', () => {
  it('flags daily and weekly hours below explicit thresholds', () => {
    const result = summarizeWorkload([{ accountId: 'a', worklogs: [{ startDate: '2026-01-05', timeSpentSeconds: 8 * 3600 }] }], options);
    expect(result.personas[0].bajoDiario).toHaveLength(6);
    expect(result.personas[0].bajoSemanal).toEqual([{ semanaDesde: '2026-01-05', horas: 8 }]);
  });

  it('requires explicit period assumptions and valid ordered dates', () => {
    expect(() => validate(schemas.teamWorkloadSummary, { ...options, accountIds: ['a', 'a'] })).toThrow('unique');
    expect(() => validate(schemas.teamWorkloadSummary, { ...options, accountIds: ['a'], from: '2026-01-12' })).toThrow('on or before');
    expect(() => validate(schemas.teamWorkloadSummary, { ...options, accountIds: ['a'], timezone: 'not-a-timezone' })).toThrow('IANA');
    expect(() => validate(schemas.teamWorkloadSummary, { accountIds: ['a'], from: options.from, to: options.to })).toThrow();
  });
});
