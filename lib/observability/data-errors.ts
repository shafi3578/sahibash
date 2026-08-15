type DataError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

export function reportDataError(operation: string, error: unknown) {
  const candidate = error && typeof error === "object" ? (error as DataError) : null;
  console.error("[sahibash:data]", {
    operation,
    code: candidate?.code ?? "unexpected_error",
    message: candidate?.message ?? (error instanceof Error ? error.message : "Unknown data error"),
    details: candidate?.details,
    hint: candidate?.hint,
  });
}
