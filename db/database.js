import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

 export const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});


pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database', err.stack);
  } else {
    console.info('Connected to the database', res.rows[0].now);
  }
});

export const db = {
  query: (text, params, callback) => {
    return pool.query(text, params, callback);
  },
};