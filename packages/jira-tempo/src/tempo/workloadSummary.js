function dateRange(from, to) {
  const dates = [];
  for (
    let date = new Date(`${from}T00:00:00Z`);
    date <= new Date(`${to}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    dates.push(date.toISOString().slice(0, 10));
  }
  return dates;
}

function weekStart(date, weekStartsOn) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  const offset = weekStartsOn === 'monday' ? (day + 6) % 7 : day;
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() - offset);
  return value.toISOString().slice(0, 10);
}

export function summarizeWorkload(results, options) {
  const { from, to, dailyThresholdHours, weeklyThresholdHours, weekStartsOn, timezone } =
    options;
  return {
    periodo: {
      desde: from,
      hasta: to,
      zonaHorariaDeclarada: timezone,
      inicioSemana: weekStartsOn,
    },
    umbralesHoras: { diario: dailyThresholdHours, semanal: weeklyThresholdHours },
    personas: results.map(({ accountId, worklogs }) => {
      const daily = Object.fromEntries(dateRange(from, to).map((date) => [date, 0]));
      for (const worklog of worklogs) {
        if (daily[worklog.startDate] !== undefined)
          daily[worklog.startDate] += (worklog.timeSpentSeconds || 0) / 3600;
      }
      const weekly = {};
      for (const [date, hours] of Object.entries(daily)) {
        const week = weekStart(date, weekStartsOn);
        weekly[week] = (weekly[week] || 0) + hours;
      }
      const bajoDiario = Object.entries(daily)
        .filter(([, hours]) => hours < dailyThresholdHours)
        .map(([fecha, horas]) => ({ fecha, horas }));
      const bajoSemanal = Object.entries(weekly)
        .filter(([, hours]) => hours < weeklyThresholdHours)
        .map(([semanaDesde, horas]) => ({ semanaDesde, horas }));
      return {
        accountId,
        totalHoras: Object.values(daily).reduce((sum, hours) => sum + hours, 0),
        bajoDiario,
        bajoSemanal,
      };
    }),
    limitacion:
      'Los días se agrupan por startDate entregado por Tempo; la zona horaria es una suposición declarada por quien consulta.',
  };
}
