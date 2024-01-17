export const useDates = () => {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const thirtyDays = 60 * 60 * 24 * 30 * 1000;
  const sixtyDays = thirtyDays * 2;
  const ninetyDays = thirtyDays * 3;

  const thirtyDaysFromNow = new Date(today.getTime() + thirtyDays).getTime();
  const sixtyDaysFromNow = new Date(today.getTime() + sixtyDays).getTime();
  const ninetyDaysFromNow = new Date(today.getTime() + ninetyDays).getTime();

  const oneDayInMilliseconds = 60 * 60 * 24 * 1000;

  return {
    today,
    tomorrow,
    thirtyDays,
    sixtyDays,
    ninetyDays,
    thirtyDaysFromNow,
    sixtyDaysFromNow,
    ninetyDaysFromNow,
    oneDayInMilliseconds,
  };
};
