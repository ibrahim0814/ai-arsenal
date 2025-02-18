export const formatPacificDate = (
  dateString: string,
  options: Intl.DateTimeFormatOptions = {}
) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles",
    ...options,
  });
};

export const toPacificDate = (dateString: string) => {
  const date = new Date(dateString);
  const utcDate = new Date(date.toUTCString());
  return new Date(
    utcDate.getTime() + (utcDate.getTimezoneOffset() + 480) * 60000
  );
};

export const formatPacificDateTime = (dateString: string) => {
  return formatPacificDate(dateString, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
};

export const formatPacificDateShort = (dateString: string) => {
  return formatPacificDate(dateString, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatPacificTime = (dateString: string) => {
  return formatPacificDate(dateString, {
    hour: "numeric",
    minute: "numeric",
  });
};

export const formatPacificDateVeryShort = (dateString: string) => {
  return formatPacificDate(dateString, {
    month: "short",
    day: "numeric",
  });
};
