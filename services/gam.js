import { ReportServiceClient } from "@google-ads/admanager";
import { formatDate } from "../utils/date.util.js";
import { fetchReportForUser } from "./report.service.js";
import { db } from "../db/database.js";
import { generateDefinitionHash } from "../utils/hash.util.js";

// Instantiates a client
const admanagerClient = new ReportServiceClient({
  keyFile: "./credentials.json",
});

const DIMENSIONS = ["DATE", "AD_UNIT_NAME", "COUNTRY_NAME", "SITE"];

const METRICS = [
  "AD_EXCHANGE_CLICKS",
  "AD_EXCHANGE_CPC",
  "AD_EXCHANGE_CTR",
  "PROGRAMMATIC_MATCH_RATE",
  "AD_EXCHANGE_MATCH_RATE",
  "AD_EXCHANGE_TOTAL_REQUESTS",
  "AD_EXCHANGE_REVENUE",
  "AD_EXCHANGE_ACTIVE_VIEW_VIEWABLE_IMPRESSIONS_RATE",
  "AD_EXCHANGE_IMPRESSIONS",
  "AD_SERVER_IMPRESSIONS",
];

function extractValue(cell) {
  if (!cell || typeof cell !== "object") return null;

  if (cell.intValue !== undefined) {
    return Number(cell.intValue);
  }

  if (cell.doubleValue !== undefined) {
    return cell.doubleValue;
  }

  if (cell.stringValue !== undefined) {
    return cell.stringValue;
  }

  if (cell.moneyValue !== undefined) {
    return Number(cell.moneyValue.units || 0);
  }

  return null;
}

// export async function fetchGamData(req, res) {
//   try {
//     const { reportId } = req.params;

//     if (!reportId) res.status(400).json({ message: "ReportId is required" });

//     //  Fetch report definition from DB
//     const reportDetail = await fetchReportForUser(reportId);

//     if (!reportDetail) {
//       return res.status(404).json({ message: "Report not found" });
//     }

//     const sitefilter = reportDetail.filters?.find(
//       (filter) => filter.field == "SITE",
//     );

//     if (!sitefilter) {
//       return res.status(400).json({ message: "SITE filter is required" });
//     }

//     const newHash = generateDefinitionHash(reportDetail);

//     const parent = "networks/23301900962";

//     let reportName;

//     if (
//       reportDetail.external_report_id &&
//       reportDetail.definition_hash === newHash
//     ) {
//       reportName = reportDetail.external_report_id;
//       console.log("hash match ");
//     }
//     //  Build date range
//     const dateRange =
//       reportDetail.date_range.type === "relative"
//         ? { relative: reportDetail.date_range[0].value }
//         : {
//             fixed: {
//               startDate: reportDetail.date_range[0].startDate,
//               endDate: reportDetail.date_range[0].endDate,
//             },
//           };

//     // 3 CREATE REPORT ONLY IF NOT EXISTS
//     if (!reportName) {
//       const report = {
//         displayName: reportDetail.name,
//         reportDefinition: {
//           dimensions: reportDetail.dimensions,
//           metrics: reportDetail.metrics,
//           dateRange,
//           reportType: "HISTORICAL",
//           filters: createGamFilters(reportDetail.filters),
//           sorts: [
//             {
//               field: "AD_UNIT_NAME",
//             },
//           ],
//         },
//       };

//       const [createResponse] = await admanagerClient.createReport({
//         parent,
//         report,
//       });

//       reportName = createResponse.name;

//       console.log("new report created");
//       // save external_report_id
//       await db.query(
//         `UPDATE reports
//          SET external_report_id = $1,
//          definition_hash=$2,
//           updated_at = NOW()
//          WHERE id = $3`,
//         [reportName, newHash, reportId],
//       );
//     }

//     const options = {
//       initialRetryDelayMillis: 500, // Initial delay of 500ms
//       retryDelayMultiplier: 1.5,
//       maxRetryDelayMillis: 30, // Max poll delay of 30 seconds
//       totalTimeoutMillis: 60 * 60 * 1000, // Total timeout of 1 hour
//     };
//     //  RUN REPORT
//     const [operation] = await admanagerClient.runReport({ name: reportName });
//     operation.backoffSettings = options;
//     const [runResponse] = await operation.promise();

//     const resultName = runResponse.reportResult;
//     // 1. Get these from the URL query strings
//     const pageSize = parseInt(req.query.pageSize) || 100;

//     const pageToken = req.query.pageToken || null;
//     //  FETCH RESULT ROWS
//     const allRows = [];

//     // const rowIterable = admanagerClient.fetchReportResultRowsAsync({
//     //   name: resultName,
//     //   pageSize: pageSize ?? null,
//     //   pageToken: pageToken ?? null,
//     // });

//     // let count = 0;

//     // for await (const page of rowIterable) {
//     //   const row = {};

//     //   // if (count == 10) break;
//     //   page.dimensionValues.forEach((dimension, i) => {
//     //     row[reportDetail.dimensions[i].toLowerCase()] = extractValue(dimension);
//     //   });

//     //   const metricValues = page.metricValueGroups?.[0]?.primaryValues || [];

//     //   metricValues.forEach((metric, i) => {
//     //     row[reportDetail.metrics[i].toLowerCase()] = extractValue(metric);
//     //   });
//     //   allRows.push({ ...row, date: formatDate(String(row.date)) });
//     //   count++;
//     // }

//     // //  RETURN DATA
//     // return res.status(200).json({
//     //   reportId,
//     //   rows: allRows,
//     //   rowCount: allRows.length,
//     //   totalRowCount: rowIterable.totalRowCount,
//     //   nextPageToken: rowIterable.nextPageToken || null,
//     // });

//     const [rows, response] = await admanagerClient.fetchReportResultRows({
//       name: resultName, // This is your report result resource name
//       pageSize: pageSize,
//       pageToken: pageToken,
//       autoPaginate: false,
//     });

//     console.log(rows.length, "rows");
//     console.log(response, "resp");
//     const formattedRows = rows.map((pageRow) => {
//       const row = {};

//       // Map Dimensions
//       pageRow.dimensionValues.forEach((dimension, i) => {
//         row[reportDetail.dimensions[i].toLowerCase()] = extractValue(dimension);
//       });

//       // Map Metrics
//       const metricValues = pageRow.metricValueGroups?.[0]?.primaryValues || [];
//       metricValues.forEach((metric, i) => {
//         row[reportDetail.metrics[i].toLowerCase()] = extractValue(metric);
//       });

//       // Format row date
//       return { ...row, date: formatDate(String(row.date)) };
//     });

//     // 3. RETURN DATA + THE "BOOKMARK" (nextPageToken)
//     return res.status(200).json({
//       reportId,
//       rows: formattedRows,
//       pageRowCount: rows.length,
//       nextPageToken: response?.nextPageToken || null,
//     });
//   } catch (err) {
//     console.error("Error fetching gam data", err);
//     console.error("reason", err.reason);
//     res.status(500).json({ error: err.message });
//   }
// }

function createGamFilters(filters) {
  const gamFilters =
    filters
      ?.map((f) => {
        // DIMENSION FILTER
        if (f.type === "DIMENSION") {
          return {
            fieldFilter: {
              field: { dimension: f.field },
              operation: f.operator || "IN",
              values: f.values.map((v) => ({
                stringValue: String(v),
              })),
              metricValueType: "PRIMARY",
            },
          };
        }

        //METRIC FILTER
        if (f.type === "METRIC") {
          return {
            fieldFilter: {
              field: { metric: f.field },
              operation: f.operator,
              values: [{ intValue: String(f.values[0]) }],
              metricValueType: "PRIMARY",
            },
          };
        }

        //  throw new Error(`Unknown filter type: ${f.type}`);
      })
      .filter(Boolean) || [];

  const finalFilters =
    gamFilters.length === 1
      ? gamFilters[0] // single filter allowed
      : [{ andFilter: { filters: gamFilters } }];

  return gamFilters;
}

// function createGamFilters(filters) {
//   if (!filters || !Array.isArray(filters) || filters.length === 0) return [];

//   const processedFilters = filters.map((f) => {
//     const isDimension = f.type === "DIMENSION";

//     // This is the "Filter" object structure
//     return {
//       fieldFilter: {
//         field: isDimension ? { dimension: f.field } : { metric: f.field },
//         operation: f.operator || (isDimension ? "IN" : "GREATER_THAN"),
//         values: f.values.map((v) => (
//           isDimension
//             ? { stringValue: String(v) }
//             : { intValue: String(v) }
//         )),
//         // Must be PRIMARY for standard report data
//         metricValueType: "PRIMARY"
//       }
//     };
//   }).filter(Boolean);

//   if (processedFilters.length === 0) return [];

//   // If there's only 1 filter, return it inside the array
//   if (processedFilters.length === 1) {
//     return [processedFilters[0]];
//   }

//   // If there are multiple, wrap them in an andFilter inside the array
//   return [
//     {
//       andFilter: {
//         filters: processedFilters
//       }
//     }
//   ];
// }

export async function fetchGamData(req, res) {
  try {
    const { reportId } = req.params;

    if (!reportId)
      return res.status(400).json({ message: "ReportId is required" });

    // Fetch report definition from DB
    const reportDetail = await fetchReportForUser(reportId);

    if (!reportDetail)
      return res.status(404).json({ message: "Report not found" });

    const siteFilter = reportDetail.filters?.find((f) => f.field === "SITE");

    if (!siteFilter)
      return res.status(400).json({ message: "SITE filter is required" });

    const newHash = generateDefinitionHash(reportDetail);

    const parent = "networks/YOUR_NETWORK_CODE";

    let reportName = reportDetail.external_report_id;

    // Build date range
    const dateRange =
      reportDetail.date_range[0].type === "relative"
        ? { relative: reportDetail.date_range[0].value }
        : {
            fixed: {
              startDate: reportDetail.date_range[0].startDate,
              endDate: reportDetail.date_range[0].endDate,
            },
          };

    // 1. CREATE or UPDATE report
    if (!reportName) {
      // CREATE new report
      const [createResponse] = await admanagerClient.createReport({
        parent,
        report: {
          displayName: reportDetail.name,
          reportDefinition: {
            dimensions: reportDetail.dimensions,
            metrics: reportDetail.metrics,
            dateRange,
            reportType: "HISTORICAL",
            filters: createGamFilters(reportDetail.filters),
          },
        },
      });

      reportName = createResponse.name;

      console.log("New report created");

      await db.query(
        `UPDATE reports
         SET external_report_id = $1,
             definition_hash = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [reportName, newHash, reportId],
      );
    } else if (
      reportDetail.definition_hash !== newHash &&
      reportDetail.external_report_id != null
    ) {
      // UPDATE existing report
      const updatedReportDefinition = {
        name: reportName,
        reportDefinition: {
          dimensions: reportDetail.dimensions,
          metrics: reportDetail.metrics,
          dateRange,
          filters: createGamFilters(reportDetail.filters),
          //sorts: [{ field: { dimension: "DATE" }, descending: true }],
        },
      };

      const fieldMask = {
        paths: [
          "reportDefinition.dimensions",
          "reportDefinition.metrics",
          "reportDefinition.dateRange",
          "reportDefinition.filters",
          // "reportDefinition.sorts",
        ],
      };

      await admanagerClient.updateReport({
        updateMask: fieldMask,
        report: updatedReportDefinition,
      });

      console.log("Report updated");

      await db.query(
        `UPDATE reports
         SET definition_hash = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [newHash, reportId],
      );
    } else {
      console.log("Report unchanged, using existing one");
    }

    // 2. RUN the report
    const options = {
      initialRetryDelayMillis: 500,
      retryDelayMultiplier: 1.5,
      maxRetryDelayMillis: 30000,
      totalTimeoutMillis: 60 * 60 * 1000,
    };

    const [operation] = await admanagerClient.runReport({ name: reportName });

    operation.backoffSettings = options;

    const [runResponse] = await operation.promise();

    const resultName = runResponse.reportResult;
    const pageSize = parseInt(req.query.pageSize) || 100;
    const pageToken = req.query.pageToken || null;

    // 3. FETCH RESULT ROWS
    const [rows, request, response] =
      await admanagerClient.fetchReportResultRows(
        {
          name: resultName,
          pageSize,
          pageToken,
        },
        { autoPaginate: false },
      );

    const formattedRows = rows.map((pageRow) => {
      const row = {};

      pageRow.dimensionValues.forEach((dimension, i) => {
        row[reportDetail.dimensions[i].toLowerCase()] = extractValue(dimension);
      });

      const metricValues = pageRow.metricValueGroups?.[0]?.primaryValues || [];
      metricValues.forEach((metric, i) => {
        row[reportDetail.metrics[i].toLowerCase()] = extractValue(metric);
      });

      return { ...row, date: formatDate(String(row.date)) };
    });

    // 4. RETURN DATA
    return res.status(200).json({
      reportId,
      rows: formattedRows,
      pageRowCount: rows.length,
      nextPageToken: response?.nextPageToken || null,
    });
  } catch (err) {
    console.error("Error fetching GAM data", err);
    res.status(500).json({ error: err.message });
  }
}
