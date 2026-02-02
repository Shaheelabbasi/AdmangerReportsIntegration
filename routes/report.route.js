import express from "express";
import {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport
} from "../services/report.service.js";
import { fetchGamData } from "../services/gam.js";

const reportRouter = express.Router();

reportRouter.get("/gam/:reportId", fetchGamData);
reportRouter.post("/", createReport);        // CREATE
reportRouter.get("/user/:userId", getReports);
reportRouter.get("/:id", getReportById);      // READ ONE
reportRouter.patch("/:id", updateReport);       // UPDATE
reportRouter.delete("/:id", deleteReport);    // DELETE

export default reportRouter;
