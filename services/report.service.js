import { db } from "../db/database.js";

/* =========================
   CREATE REPORT
========================= */
export const createReport = async (req, res) => {
  try {
    const { name, dimensions, metrics, date_range, filters, userId } = req.body;

    if (!userId) res.status(400).json({ message: "UserId is required" });

    const query = `
      INSERT INTO reports
      (name, dimensions, metrics, date_range, filters,user_id)
      VALUES ($1, $2, $3, $4,$5::jsonb,$6)
      RETURNING *
    `;
    const { rows } = await db.query(query, [
      name,
      dimensions,
      metrics,
      date_range ? JSON.stringify(date_range) : null,
      filters ? JSON.stringify(filters) : null,
      userId,
    ]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   GET ALL REPORTS
========================= */
export const getReports = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const { rows } = await db.query(
      `SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   GET REPORT BY ID
========================= */
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await db.query(`SELECT * FROM reports WHERE id = $1`, [
      id,
    ]);

    if (!rows.length) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   UPDATE REPORT
========================= */
export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;

    const allowedFields = [
      "name",
      "dimensions",
      "metrics",
      "date_range",
      "filters",
      "external_report_id",
      "last_run_at",
    ];

    // Filter valid fields
    const fieldsToUpdate = Object.keys(req.body).filter((key) =>
      allowedFields.includes(key),
    );

    if (fieldsToUpdate.length === 0) {
      return res
        .status(400)
        .json({ error: "No valid fields provided to update" });
    }

    const values = [];
    const setClauses = [];

    fieldsToUpdate.forEach((field, index) => {
      let value = req.body[field];

      // JSONB fields must be stringified
      if (field === "filters" || field === "date_range") {
        value = value ? JSON.stringify(value) : null;
      }

      values.push(value);
      setClauses.push(`${field} = $${index + 1}`);
    });

    // Add report id as last param
    values.push(id);

    const query = `
      UPDATE reports
      SET ${setClauses.join(", ")},
          updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `;

    const { rows } = await db.query(query, values);

    if (!rows.length) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   DELETE REPORT
========================= */
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const { rowCount } = await db.query(`DELETE FROM reports WHERE id = $1`, [
      id,
    ]);

    if (!rowCount) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({ message: "Report deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Database function
export const fetchReportForUser = async (reportId) => {
  const { rows } = await db.query(`SELECT * FROM reports WHERE id = $1`, [
    reportId,
  ]);
  if (!rows.length) return null;
  return rows[0];
};
