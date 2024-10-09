const env = require('dotenv').config();
const path = require("path");
const express = require("express");
const router = express.Router();

// client side static assets
router.get("/", (_, res) => res.sendFile(path.join(__dirname, "./index.html")));
router.get("/client.js", (_, res) =>
    res.sendFile(path.join(__dirname, "./client.js"))
);

/**
 * Student code starts here
 */

// connect to postgres
const pg = require("pg");
if (env.error) {
    console.error('Failed to load .env file', env.error);
}
const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

router.get("/type", async (req, res) => {
    const { type } = req.query;
    console.log("get ingredients", type);

    // return all ingredients of a type

    const { rows } = await pool.query(
        `SELECT * FROM ingredients WHERE type = $1`,
        [type]
    );

    res.json({ rows });
});

router.get("/search", async (req, res) => {
    let { term, page } = req.query;
    page = page ? page : 0;
    console.log("search ingredients", term, page);

    // return all columns as well as the count of all rows as total_count
    // make sure to account for pagination and only return 5 rows at a time
    const { rows } = await pool.query(
        `SELECT *, COUNT(*) OVER ()::INT AS total_count FROM ingredients WHERE CONCAT(title, type) ILIKE $1 OFFSET $2 LIMIT 5`,
        [`%${term}%`, page * 5]
    );

    res.json({ rows });
});

/**
 * Student code ends here
 */

module.exports = router;
