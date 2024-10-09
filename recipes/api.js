const env = require('dotenv').config();
const path = require("path");
const express = require("express");
const router = express.Router();

// client side static assets
router.get("/", (_, res) => res.sendFile(path.join(__dirname, "./index.html")));
router.get("/client.js", (_, res) =>
    res.sendFile(path.join(__dirname, "./client.js"))
);
router.get("/detail-client.js", (_, res) =>
    res.sendFile(path.join(__dirname, "./detail-client.js"))
);
router.get("/style.css", (_, res) =>
    res.sendFile(path.join(__dirname, "../style.css"))
);
router.get("/detail", (_, res) =>
    res.sendFile(path.join(__dirname, "./detail.html"))
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

router.get("/search", async function (req, res) {
    console.log("search recipes");

    // return recipe_id, title, and the first photo as url
    //
    // for recipes without photos, return url as default.jpg
    const { rows } = await pool.query(`
        SELECT DISTINCT on (r.recipe_id)
            r.recipe_id AS recipe_id,
            r.title AS title,
            COALESCE(p.url, 'default.jpg') AS url
        FROM
            recipes r
        LEFT JOIN
            recipes_photos p
        ON
            r.recipe_id = p.recipe_id
        ORDER BY
            r.recipe_id
    `);

    res.json({ rows });

});

router.get("/get", async (req, res) => {
    const recipeId = req.query.id ? +req.query.id : 1;
    console.log("recipe get", recipeId);

    // return all ingredient rows as ingredients
    //    name the ingredient image `ingredient_image`
    //    name the ingredient type `ingredient_type`
    //    name the ingredient title `ingredient_title`
    //
    //
    // return all photo rows as photos
    //    return the title, body, and url (named the same)
    //
    //
    // return the title as title
    // return the body as body
    // if no row[0] has no photo, return it as default.jpg

    const ingredientsQuery = await pool.query(`
        SELECT
            i.title AS ingredient_title,
            i.type AS ingredient_type,
            i.image AS ingredient_image
        FROM
            recipe_ingredients ri
        INNER JOIN
            ingredients i
        ON
            i.id = ri.ingredient_id
        WHERE
            ri.recipe_id = $1
        `,
        [recipeId]
    );

    const photosQuery = await pool.query(`
        SELECT
            r.title,
            r.body,
            COALESCE(p.url, 'default.jpg') AS url
        FROM
            recipes r
        LEFT JOIN
            recipes_photos p
        ON
            p.recipe_id = r.recipe_id
        WHERE
            r.recipe_id = $1
        `,
        [recipeId]
    );

    //Javascript thing
    const [photos, ingredients] = await Promise.all([photosQuery, ingredientsQuery]);

    const convertPhotos = (photos) => {
        return photos.map((photo) => {
            return photo.url;
        });
    }

    res.json({
        ingredients: ingredients.rows,
        photos: convertPhotos(photos.rows),
        title: photos.rows[0].title,
        body: photos.rows[0].body,
    });
});
/**
 * Student code ends here
 */

module.exports = router;
