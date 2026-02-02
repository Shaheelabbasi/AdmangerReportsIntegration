import dotenv from "dotenv";

import express from "express";
import reportsRouter from "./routes/report.route.js";
import cors from 'cors'


dotenv.config();

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use(cors({
  origin:"*",
  methods:["GET","POST",'PATCH','DELETE']
}))
app.use("/api/reports", reportsRouter);



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
