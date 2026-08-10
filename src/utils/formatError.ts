/**
 * Safely extracts a string error message from any error object, string, or unknown value.
 * Prevents "Objects are not valid as a React child" errors in React.
 */
export function formatErrorMessage(err: any, defaultMsg = 'An unexpected error occurred. Please try again.'): string {
  if (!err) return defaultMsg;
  if (typeof err === 'string') return err;

  if (typeof err === 'object') {
    if (typeof err.message === 'string') return err.message;
    if (typeof err.error === 'string') return err.error;

    if (err.message && typeof err.message === 'object') {
      if (typeof err.message.message === 'string') return err.message.message;
      if (typeof err.message.error === 'string') return err.message.error;
    }

    if (err.error && typeof err.error === 'object') {
      if (typeof err.error.message === 'string') return err.error.message;
      if (typeof err.error.error === 'string') return err.error.error;
    }

    try {
      const json = JSON.stringify(err);
      if (json && json !== '{}') return json;
    } catch (e) {
      // Fall through
    }
  }

  return String(err) || defaultMsg;
}
