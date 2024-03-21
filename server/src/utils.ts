import type * as beet from "@metaplex-foundation/beet";

export function cronToTimeStringWithSteps(cronStr: string): string {
  // Split the cron string to extract seconds, minutes, and hours
  const parts = cronStr.split(" ");
  if (parts.length < 3) {
    return "Invalid cron string";
  }

  let [second, minute, hour] = parts;

  // Helper function to handle step values and wildcard
  const formatField = (field: string): string => {
    if (field === "*") return "00";
    if (field.includes("/")) {
      const [base, step] = field.split("/");
      if (base === "*") return `every ${step} units`;
      else return `from ${base} every ${step} units`;
    }
    return field.padStart(2, "0");
  };

  second = formatField(second);
  minute = formatField(minute);
  hour = formatField(hour);

  // Combine into a time string
  if (isNaN(+second) || isNaN(+minute) || isNaN(+hour)) {
    // If any field contains non-numeric value (e.g., step value), return as is
    return `At ${hour} hours, ${minute} minutes, and ${second} seconds interval`;
  } else {
    // If all are numeric, format as HH:MM:SS
    return `${hour}:${minute}:${second}`;
  }
}

export function cronFromPayoutInterval(payoutInterval: beet.bignum): string {
  return `*/${payoutInterval.toString()} * * * * *`;
}
