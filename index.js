const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;
const { Pool } = require('pg');
const fs = require('fs')
const pool = new Pool({
    // This Line is modified so that in local development you can successfully manipulate database without pushing the app to server and avoid ssl error message.
    connectionString: process.env.DATABASE_URL || 'postgres://ueqfdtqkugawmi:bcb9106b88d1895b855fb7a88c1ad68e8e66fe297050ebec63e3dea7dfd68929@ec2-34-206-8-52.compute-1.amazonaws.com:5432/d9v0qal1g956n1',
    ssl: {
        rejectUnauthorized: false
    }
});

express()
    .use(express.static(path.join(__dirname, 'public')))
    .use(express.urlencoded({ extended: true }))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/test', (req, res) => res.render('pages/test', { users: ["John", "Paul", "Ringo"] }))
    .get('/', function(req, res) {
        res.sendFile(path.join(__dirname + '/index.html'));
    })
    .get('/order', (req, res) => {
        const first_name = (req.query.first) ? req.query.first : "";
        const last_name = (req.query.last) ? req.query.last : "";

        let entree = "";
        let sideList = "";
        let order = "";
        if (req.query.entree) {
            entree = req.query.entree;
            sideList = getSides(req.query);
            order = getOrderText(entree, sideList);
        }

        let menu_info = {
            first: first_name,
            last: last_name,
            order: order
        }

        if (validateMenu(first_name, last_name, entree, sideList)) {
            let confirm_info = menu_info;
            confirm_info.streetaddress = "";
            confirm_info.cityaddress = "";

            res.render('pages/confirmation', confirm_info);
        } else {
            res.render('pages/menu', menu_info);
        }
    })
    .post('/confirm', async(req, res) => {
        const first_name = req.body.first;
        const last_name = req.body.last;
        const street_address = req.body.streetaddress;
        const city_state = req.body.cityaddress;
        const order = req.body.order;

        let confirm_info = {
            first: first_name,
            last: last_name,
            streetaddress: street_address,
            cityaddress: city_state,
            order: order
        };

        if (validateConfirm(first_name, last_name, street_address, city_state, order)) {
            // Push the new information to the database
            // and get the result for the new order number
            //
            // example insert
            // INSERT INTO order_table (first_name, last_name, street_address, 
            //                          city_address, food_order, order_time, order_status)
            // VALUES ('Hope', 'Dog', '12 Street St', 'Northampton, MA', 
            //         'Fake order foods 4', now(), 'Received') 
            // RETURNING id;
            let query_text = "INSERT INTO order_table (first_name, last_name, street_address, ";
            query_text += "city_address, food_order, order_time, order_status) ";
            query_text += "VALUES ('" + first_name + "', '" + last_name + "', '" + street_address + "', '";
            query_text += city_state + "', '" + order + "', now(), 'Received') RETURNING id;";

            try {
                const client = await pool.connect();

                // INSERT the new order information
                const result = await client.query(query_text);

                // get the new ID number returned from the INSERT query
                const order_number = (result) ? result.rows[0].id : null;

                // with the new order number, get the appropriate customer info
                const select_result = await client.query('SELECT * FROM order_table WHERE id = ' + order_number);
                const results = (select_result) ? select_result.rows[0] : null;

                const order_status = results.order_status;
                const first_name = results.first_name;
                const last_name = results.last_name;
                const street_address = results.street_address;
                const city_state = results.city_address;
                const order = results.food_order;

                let customer_info = {
                    first: first_name,
                    last: last_name,
                    streetaddress: street_address,
                    cityaddress: city_state,
                    order: order,
                    ordernumber: order_number,
                    orderstatus: order_status
                };

                res.render('pages/customerstatus', customer_info);
                client.release();
            } catch (err) {
                console.error(err);
                res.send("Error " + err);
            }
        } else {
            res.render('pages/confirmation', confirm_info);
        }
    })
    // /status is the customer facing status page
    .get('/status', async(req, res) => {
        // replace first_name and everything from body with only the order number
        // the order number should be used to retrieve everything from the database.
        const order_number = req.query.ordernumber;

        // retrieve order info from database, determined by ordernumber
        //
        try {
            const client = await pool.connect();
            const result = await client.query('SELECT * FROM order_table WHERE id = ' + order_number);
            const results = (result) ? result.rows[0] : null;

            // assemble the local variables for the order status
            const order_status = results.order_status;
            const first_name = results.first_name;
            const last_name = results.last_name;
            const street_address = results.street_address;
            const city_state = results.city_address;
            const order = results.food_order;

            let customer_info = {
                first: first_name,
                last: last_name,
                streetaddress: street_address,
                cityaddress: city_state,
                order: order,
                ordernumber: order_number,
                orderstatus: order_status
            };

            res.render('pages/customerstatus', customer_info);
            client.release();
        } catch (err) {
            console.error(err);
            res.send("Error " + err);
        }
    })
    .get('/service', async(req, res) => {
        try {
            // query the db for all the orders
            const client = await pool.connect();
            const result = await client.query('SELECT * FROM order_table');
            const results = (result) ? result.rows : null;

            // format the db results into orders for rendering
            let orders = [];
            for (let i = 0; i < results.length; i++) {
                let o = results[i];
                orders.push({
                    timestamp: o.order_time,
                    order: o.food_order,
                    id: o.id,
                    first: o.first_name,
                    last: o.last_name,
                    streetaddress: o.street_address,
                    cityaddress: o.city_address,
                    orderstatus: o.order_status
                });
            }

            // render the page with the orders
            res.render('pages/servicestatus', { orders: orders });
            client.release();
        } catch (err) {
            console.error(err);
            res.send("Error " + err);
        }
    })
    .post('/service', async(req, res) => {
        try {
            const order_number = req.body.id;

            // GET THE CURRENT ORDER_STATUS
            const client = await pool.connect();
            const old_status_result = await client.query('SELECT order_status FROM order_table WHERE id=' + order_number);

            old_status = old_status_result.rows[0].order_status;

            // EXAMPLE UPDATE
            // update order_table set order_status='Cooking' where id=1;
            // 
            // 'Received' -> 'Cooking'
            // 'Cooking' -> 'Out For Delivery'
            // 'Out For Delivery' -> 'Delivered'
            // 'Delivered' -> 'Delivered'
            let new_status = "";
            if (old_status === 'Received')
                new_status = 'Cooking';
            else if (old_status === 'Cooking')
                new_status = 'Out For Delivery';
            else
                new_status = 'Delivered';

            // update the db with the new status
            await client.query("UPDATE order_table set order_status='" + new_status + "' where id=" + order_number);

            // query the db for all the orders
            const order_result = await client.query('SELECT * FROM order_table');
            const results = (order_result) ? order_result.rows : null;

            // format the db results into orders for rendering
            let orders = [];
            for (let i = 0; i < results.length; i++) {
                let o = results[i];
                orders.push({
                    timestamp: o.order_time,
                    order: o.food_order,
                    id: o.id,
                    first: o.first_name,
                    last: o.last_name,
                    streetaddress: o.street_address,
                    cityaddress: o.city_address,
                    orderstatus: o.order_status
                });
            }

            // render the page with the orders
            res.render('pages/servicestatus', { orders: orders });
            client.release();
        } catch (err) {
            console.error(err);
            res.send("Error " + err);
        }
    })

    // /db is a debugging view into the complete order_table database table
    .get('/db', async(req, res) => {
        try {
            const client = await pool.connect();
            const result = await client.query('SELECT * FROM non_content_table');
            const results = { 'results': (result) ? result.rows : null };
            res.render('pages/db', results);
            client.release();
        } catch (err) {
            console.error(err);
            res.send("Error " + err);
        }
    })
    .get('/yuyang', (req, res) => res.render('pages/yuyang'))
    .post('/yuyang', async (req, res) => {
        if (req.body.textScene && req.body.play && req.body.text) {
            let textScene = req.body.textScene;
            let play = req.body.play;
            let text = req.body.text;
            // Get length of table / max document id
            const client = await pool.connect();
            const result = await client.query("SELECT count(*) FROM non_content_table");
            let docId = result.rows ? parseInt(result.rows[0].count) + 1 : 0;
            // Original text mean and std are 6019, and 4963
            // Short if < mean - 1 std, long if > mean + 1 std, medium otherwise
            let short = text.length < 6019 - 4963 ? "TRUE" : "FALSE";
            let long = text.length > 6019 + 4963 ? "TRUE" : "FALSE";
            let med = !(short || long) ? "TRUE" : "FALSE";
            let sqlCommand = "INSERT INTO non_content_table (doc_id, scene_title, play_title, tag_english, tag_short, tag_med, tag_long) values ";
            sqlCommand += `(${docId}, '${textScene.toLowerCase()}', '${play.toLowerCase()}', TRUE, ${short}, ${med}, ${long})`;
            await client.query(sqlCommand);
            client.release();
            // Write document text and snippet to files
            fs.writeFileSync(path.join(__dirname, `documents/full/${docId}.txt`), text, {encoding:'utf8', flag:'w'});
            let snippet = text.substring(0, Math.min(400, text.length));
            fs.writeFileSync(path.join(__dirname, `documents/snippets/${docId}.txt`), snippet, {encoding:'utf8', flag:'w'});
            res.redirect(308, `/jurgen/${docId}`);
        } else {
            res.send("fail");
            res.end();
        }
    })
    .get('/ryan', handleSearchRequest)
    .get('/jurgen', function (req, res) {
        let noPage = -1;
        res.render('pages/jurgen', {noPage: true})
    })
    .get('/jurgen/:docId', async function (req, res) {
        let docId = req.params.docId;
        try {
            const client = await pool.connect();
            const result = await client.query(`SELECT * FROM non_content_table where doc_id = ${docId}`);
            let text = fs.readFileSync(path.join(__dirname, `documents/full/${docId}.txt`), {encoding:'utf8', flag:'r'}).split("\n");
            const results = { 'results': (result) ? result.rows[0] : null, noPage: false, text: text };
            res.render('pages/jurgen', results);
            client.release();
        } catch (err) {
            console.error(err);
            res.send("Error " + err);
        }
    })
    .get('/shivangi', (req, res) => res.render('pages/shivangi'))
    .listen(PORT, () => console.log(`Listening on ${ PORT }`));

/*  HELPER FUNCTIONS BELOW */

async function removeRowsWithoutDocs() {
    // Clear any rows without a corresponding document
    try {
        const client = await pool.connect();
        // Get length of table / max document id
        const result = await client.query("SELECT * FROM non_content_table");
        let rows = result ? result.rows : [];
        for (let i = 0; i < rows.length; ++i) {
            let docId = rows[i].doc_id;
            if (!fs.existsSync(path.join(__dirname, `documents/full/${docId}.txt`))) { // No file for row
                await client.query(`DELETE FROM non_content_table WHERE doc_id = ${docId}`);
                console.log(`Removing row for document with id: ${docId}`);
            }
        }
        client.release();
    } catch (err) {
        console.error(err);
    }
}
removeRowsWithoutDocs(); // Clear any rows without a corresponding document

function termSetFromDocId(docId) {
    // Return set of tokens in document with id docId
    return new Set(fs.readFileSync(path.join(__dirname, `documents/full/${docId}.txt`), 'utf8').toString().toLowerCase().split(" "));
}

function includeSnippets(result) {
    try {
        // Get the snippets
        for (let i = 0; i < result.rows.length; ++i) {
            let docId = result.rows[i].doc_id;
            let snippetText = fs.readFileSync(path.join(__dirname, `documents/snippets/${docId}.txt`), 'utf8').toString();
            result.rows[i]['snippet'] = snippetText;
        }
    } catch(err) {
        console.error(err);
    }
}

async function handleContentSearch(req, res) {
    let pos = parseInt(req.query.queryposition); // Position in search results
    let queryTokens = req.query.query.toLowerCase().split(" "); // Split on whitespace
    let lastDocId = 0;
    let returned_rows = [];
    ++pos; // Only consider documents after this position
    try {
        const client = await pool.connect();
        // Get length of table / max document id
        const result = await client.query("SELECT count(*) FROM non_content_table");
        lastDocId = result.rows ? result.rows[0].count : 0;
        while ((pos <= lastDocId) && (returned_rows.length < 8)) {
            let docTokens = termSetFromDocId(pos); // Check if document contains all query tokens
            let containsAll = true;
            for (let i = 0; i < queryTokens.length; ++i) {
                if (!docTokens.has(queryTokens[i])) {
                    containsAll = false;
                    break;
                }
            }
            if (containsAll) {
                let row = await client.query(`SELECT * FROM non_content_table WHERE doc_id = ${pos}`);
                row = row ? row.rows[0] : null;
                returned_rows.push(row);
            }
            ++pos;
        }
        includeSnippets({'rows': returned_rows});
        res.json({'results': returned_rows});
        client.release();
    } catch (err) {
        console.error(err);
    }
}

// Server side processing of requests to search results page
let validSearchTypes = new Set(["content","scene","play","tags"]);
let validTags = new Set(["tag_english", "tag_short", "tag_med", "tag_long"]);
async function handleSearchRequest(req, res) {
    let emptyResults = {'results': []};
    let pos = parseInt(req.query.queryposition); // Position in search results (Number of times Show More was pressed)
    if (req.query.queryposition && Number.isInteger(pos)) { // Sends a block of results if possible
        if (req.query.query && req.query.searchtype && validSearchTypes.has(req.query.searchtype)) {
            req.query.query = req.query.query.toLowerCase(); // Don't consider case
            let SQLQueryString;
            let validQuery = true;
            if (req.query.searchtype === "content") {
                handleContentSearch(req, res);
            } else if (req.query.searchtype === "scene") {
                SQLQueryString = `SELECT * FROM non_content_table WHERE scene_title = '${req.query.query}' OFFSET ${pos*8} ROWS FETCH FIRST 8 ROW ONLY`;
            } else if (req.query.searchtype === "play") {
                SQLQueryString = `SELECT * FROM non_content_table WHERE play_title = '${req.query.query}' OFFSET ${pos*8} ROWS FETCH FIRST 8 ROW ONLY`;
            } else { // Tags
                if (validTags.has(req.query.query)) {
                    SQLQueryString = `SELECT * FROM non_content_table WHERE ${req.query.query} OFFSET ${pos*8} ROWS FETCH FIRST 8 ROW ONLY`;
                } else {
                    validQuery = false;
                }
            }
            if (req.query.searchtype !== "content") {
                if (validQuery) {
                    try {
                        const client = await pool.connect();
                        const result = await client.query(SQLQueryString);
                        const results = { 'results': (result) ? result.rows : null };
                        includeSnippets(result);
                        res.json(results);
                        client.release();
                    } catch (err) {
                        console.error(err);
                        res.json(emptyResults);
                    }
                } else {
                    res.json(emptyResults);
                }
            }
        } else {
            res.json(emptyResults); // Query wasn't valid, no search results
        }
    } else {
        res.render('pages/ryan'); // Sends page without results
    }
}

// server side validation for the menu page submissions
function validateMenu(first_name, last_name, entree, sideList) {
    let valid = false;

    if (first_name.length != 0 &&
        last_name.length != 0 &&
        entree != undefined &&
        sideList.length === 3) {
        valid = true;
    }

    return valid;
}

// server side validaiton for the confirm page submissions
function validateConfirm(first_name, last_name, street_address, city_state, order) {
    let valid = false;

    if (first_name.length != 0 &&
        last_name.length != 0 &&
        street_address.length != 0 &&
        city_state.length != 0 &&
        order.length != 0) {
        valid = true;
    }

    return valid;
}

// build a single string formatted order from the 
// entree and sides
function getOrderText(entree, sideList) {
    order = entree;

    sideList.forEach(function(r) {
        order += ", " + r;
    });
    return order;
}

// convert the item's buttons into strings
// for each of the side dishes
function getSides(body) {
    sides = [];

    if (body.item0 === "on")
        sides.push("Corn Bread")
    if (body.item1 === "on")
        sides.push("Creamed Corn")
    if (body.item2 === "on")
        sides.push("Green Beans")
    if (body.item3 === "on")
        sides.push("Mashed Potatos")
    if (body.item4 === "on")
        sides.push("Baked Beans")

    return sides;
}
