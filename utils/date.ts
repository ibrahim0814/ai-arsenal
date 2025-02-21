export const formatPacificDate = (
  dateString: string,
  options: Intl.DateTimeFormatOptions = {}
) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    ...options,
  });
};

export const toPacificDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Date(
    date.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
  );
};

export const getCurrentPacificDate = () => {
  const now = new Date();
  return new Date(
    now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
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
