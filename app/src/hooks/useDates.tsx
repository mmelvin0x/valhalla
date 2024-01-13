export const useDates = () => {
  const today = new Date(new Date().toISOString());
  const thirtyDays = 60 * 60 * 24 * 30 * 1000;
  const sixtyDays = thirtyDays * 2;
  const ninetyDays = thirtyDays * 3;

  const thirtyDaysFromNow = new Date(today.getTime() + thirtyDays).getTime();
  const sixtyDaysFromNow = new Date(today.getTime() + sixtyDays).getTime();
  const ninetyDaysFromNow = new Date(today.getTime() + ninetyDays).getTime();

  return {
    today,
    thirtyDays,
    sixtyDays,
    ninetyDays,
    thirtyDaysFromNow,
    sixtyDaysFromNow,
    ninetyDaysFromNow,
  };
};
