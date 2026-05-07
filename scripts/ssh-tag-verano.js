const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    // We update custom_description for any product matching the summer criteria,
    // avoiding appending 'verano' multiple times if it's already there.
    const query = `
        UPDATE products 
        SET custom_description = COALESCE(custom_description, short_description, '') || ' verano'
        WHERE (
            product_name ILIKE '%playa%' OR short_description ILIKE '%playa%' OR product_name ILIKE '%beach%' OR short_description ILIKE '%beach%'
            OR product_name ILIKE '%gafas%' OR short_description ILIKE '%gafas%' OR product_name ILIKE '%sunglasses%' OR short_description ILIKE '%sunglass%'
            OR product_name ILIKE '%toalla%' OR short_description ILIKE '%toalla%' OR product_name ILIKE '%towel%' OR short_description ILIKE '%towel%'
            OR product_name ILIKE '%gorra%' OR short_description ILIKE '%gorra%' OR product_name ILIKE '%cap %' OR short_description ILIKE '%cap %'
            OR product_name ILIKE '%chancla%' OR short_description ILIKE '%chancla%' OR product_name ILIKE '%slippers%' OR short_description ILIKE '%slippers%'
            OR product_name ILIKE '%sombrilla%' OR short_description ILIKE '%sombrilla%' OR product_name ILIKE '%umbrella%' OR short_description ILIKE '%umbrella%'
            OR product_name ILIKE '%abanico%' OR short_description ILIKE '%abanico%' OR product_name ILIKE '%fan %' OR short_description ILIKE '%fan %'
            OR product_name ILIKE '%nevera%' OR short_description ILIKE '%nevera%' OR product_name ILIKE '%cooler%' OR short_description ILIKE '%cooler%'
            OR product_name ILIKE '%hamaca%' OR short_description ILIKE '%hamaca%' OR product_name ILIKE '%hammock%' OR short_description ILIKE '%hammock%'
            OR product_name ILIKE '%sombrero%' OR short_description ILIKE '%sombrero%' OR product_name ILIKE '%hat %' OR short_description ILIKE '%hat %'
            OR product_name ILIKE '%balón%' OR short_description ILIKE '%balón%' OR product_name ILIKE '%balon%' OR short_description ILIKE '%balon%'
            OR category_level1 ILIKE '%playa%' OR category_level2 ILIKE '%playa%'
            OR category_level1 ILIKE '%beach%' OR category_level2 ILIKE '%beach%'
        )
        AND (custom_description IS NULL OR custom_description NOT ILIKE '%verano%');
    `;
    conn.exec(`sudo -u postgres psql universomerchan -c "${query}"`, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).on('error', (err) => {
    console.log('Connection error:', err);
}).connect({
    host: '212.227.90.110',
    port: 22,
    username: 'root',
    password: '***REMOVED***'
});
