import crypto from "crypto";

export function generateDefinitionHash(report) {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        dimensions: report.dimensions,
        metrics: report.metrics,
        date_range: report.date_range,
        filters: report.filters,
      }),
    )
    .digest("hex");
}


