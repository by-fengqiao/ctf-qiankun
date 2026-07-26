type ErrorSummary = {
  name?: string;
  code?: string;
  status?: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function safeString(value: unknown): string | undefined {
  return typeof value === 'string' && /^[A-Za-z0-9_.-]{1,64}$/.test(value)
    ? value
    : undefined;
}

function summarizeError(error: unknown): ErrorSummary {
  try {
    const record = asRecord(error);
    const response = asRecord(record?.response);
    const summary: ErrorSummary = {
      name: safeString(record?.name),
      code: safeString(record?.code),
    };
    const status = response?.status ?? record?.status;
    if (typeof status === 'number' && Number.isSafeInteger(status)) {
      summary.status = status;
    }
    return summary;
  } catch {
    return {};
  }
}

/**
 * Keep browser logs useful for triage without serializing Axios request/response
 * objects, which may contain credentials, authorization headers, or API keys.
 */
export const logger = {
  error(event: string, error?: unknown): void {
    console.error(event, summarizeError(error));
  },
  warn(event: string, error?: unknown): void {
    console.warn(event, summarizeError(error));
  },
  info(event: string, details?: unknown): void {
    console.info(event, summarizeError(details));
  },
};
