#Google Ad Manager Reporting API
Overview

This project is a Node.js backend service that allows users to create, manage, and run Google Ad Manager (GAM) reports dynamically.
It stores report definitions in a database, synchronizes them with Google Ad Manager, executes reports on demand, and returns paginated report results via REST APIs.

The system avoids unnecessary report recreation by using a definition hash to detect changes and update existing GAM reports only when required.

Features

Create, update, retrieve, and delete report definitions

Persist report configurations in a database

Automatically create or update Google Ad Manager reports

Execute GAM reports on demand

Paginated fetching of report results

Support for dimension and metric filters

Hash-based detection of report definition changes

RESTful API architecture

CORS-enabled for frontend integration

Tech Stack

Node.js

Express.js

PostgreSQL

Google Ad Manager API

ES Modules

Environment Variables

Create a .env file in the root directory:

PORT=3000
DATABASE_URL=postgresql://user:password@host:port/database

Google Ad Manager Setup

Create a Google Cloud project

Enable Google Ad Manager API

Create a service account

Download the service account key as credentials.json

Place credentials.json in the project root

Replace the network code in gam.js:

const parent = "networks/YOUR_NETWORK_CODE";

Installation
npm install

Running the Server
npm run dev

The server will run on:

http://localhost:3000

API Endpoints
Create a Report
POST /api/reports

Body

{
"name": "My GAM Report",
"dimensions": ["DATE", "SITE"],
"metrics": ["AD_EXCHANGE_REVENUE"],
"date_range": [
{
"type": "relative",
"value": "LAST_7_DAYS"
}
],
"filters": [
{
"type": "DIMENSION",
"field": "SITE",
"operator": "IN",
"values": ["example.com"]
}
],
"userId": "123"
}

Get All Reports for a User
GET /api/reports/user/:userId

Get a Report by ID
GET /api/reports/:id

Update a Report
PATCH /api/reports/:id

Only allowed fields are updated:

name

dimensions

metrics

date_range

filters

external_report_id

last_run_at

Delete a Report
DELETE /api/reports/:id

Run a Google Ad Manager Report
GET /api/reports/gam/:reportId

Query Parameters

pageSize=100
pageToken=<optional>

Response

{
"reportId": "1",
"rows": [],
"pageRowCount": 100,
"nextPageToken": "token"
}

How Report Sync Works

Report definitions are stored in the database

A hash is generated from the definition

If no GAM report exists, a new one is created

If the definition hash changes, the GAM report is updated

If unchanged, the existing GAM report is reused

The report is executed and results are fetched with pagination
