export const epochSeconds = () => Math.floor(new Date().getTime() / 1000);

// https://stackoverflow.com/questions/5129624/convert-js-date-time-to-mysql-datetime/11150727
export const toSQLDateTime = secondsOffset =>
  new Date(1000 * (new Date().getTime() / 1000 + secondsOffset))
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');

export function isPopulated(fieldString) {
  return fieldString.trim().length > 0;
}

export function passwordPolicy(pw) {
  if (pw.length < 10) return false;
  return true;
}

// validate email function courtesy of
// https://tylermcginnis.com/validate-email-address-javascript/
export function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
