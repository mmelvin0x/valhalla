import dayjs from "dayjs";

export const useDates = () => {
  const today = dayjs();
  const tomorrow = today.add(1, "day");
  const thirtyDays = 60 * 60 * 24 * 30 * 1000;
  const sixtyDays = thirtyDays * 2;
  const ninetyDays = thirtyDays * 3;

  const thirtyDaysFromNow = today.add(30, "day").toDate().getTime();
  const sixtyDaysFromNow = today.add(60, "day").toDate().getTime();
  const ninetyDaysFromNow = today.add(90, "day").toDate().getTime();

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
