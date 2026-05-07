const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    // We update custom_description for Office/Back-to-School and Fairs/Events
    const query = `
        -- Tag: Oficina / Cole
        UPDATE products 
        SET custom_description = COALESCE(custom_description, short_description, '') || ' oficina cole'
        WHERE (
            product_name ILIKE '%libreta%' OR short_description ILIKE '%libreta%' OR product_name ILIKE '%notebook%' OR short_description ILIKE '%notebook%'
            OR product_name ILIKE '%boli%' OR short_description ILIKE '%boli%' OR product_name ILIKE '% pen %' OR short_description ILIKE '% pen %' OR product_name ILIKE 'pen %'
            OR product_name ILIKE '%estuche%' OR short_description ILIKE '%estuche%' OR product_name ILIKE '%pencil%' OR short_description ILIKE '%pencil%'
            OR product_name ILIKE '%mochila%' OR short_description ILIKE '%mochila%' OR product_name ILIKE '%backpack%' OR short_description ILIKE '%backpack%'
            OR product_name ILIKE '%fiambrera%' OR short_description ILIKE '%fiambrera%' OR product_name ILIKE '%lunch%' OR short_description ILIKE '%lunch%'
            OR product_name ILIKE '%carpeta%' OR short_description ILIKE '%carpeta%' OR product_name ILIKE '%folder%' OR short_description ILIKE '%folder%'
            OR product_name ILIKE '%subrayador%' OR short_description ILIKE '%subrayador%' OR product_name ILIKE '%highlighter%' OR short_description ILIKE '%highlighter%'
            OR category_level1 ILIKE '%oficina%' OR category_level2 ILIKE '%oficina%'
            OR category_level1 ILIKE '%office%' OR category_level2 ILIKE '%office%'
        )
        AND (custom_description IS NULL OR custom_description NOT ILIKE '%oficina%');

        -- Tag: Ferias / Eventos
        UPDATE products 
        SET custom_description = COALESCE(custom_description, short_description, '') || ' feria evento'
        WHERE (
            product_name ILIKE '%lanyard%' OR short_description ILIKE '%lanyard%'
            OR product_name ILIKE '%identificador%' OR short_description ILIKE '%identificador%' OR product_name ILIKE '%badge%' OR short_description ILIKE '%badge%'
            OR product_name ILIKE '%tote%' OR short_description ILIKE '%tote%' OR product_name ILIKE '%bolsa algodon%' OR short_description ILIKE '%bolsa de algodón%'
            OR product_name ILIKE '%caramelo%' OR short_description ILIKE '%caramelo%' OR product_name ILIKE '%candy%' OR short_description ILIKE '%candy%' OR product_name ILIKE '%mint %'
            OR product_name ILIKE '%usb%' OR short_description ILIKE '%usb%' OR product_name ILIKE '%memoria%' OR short_description ILIKE '%memoria%'
            OR product_name ILIKE '%powerbank%' OR short_description ILIKE '%powerbank%' OR product_name ILIKE '%batería externa%'
            OR category_level1 ILIKE '%feria%' OR category_level2 ILIKE '%feria%'
            OR category_level1 ILIKE '%event%' OR category_level2 ILIKE '%event%'
        )
        AND (custom_description IS NULL OR custom_description NOT ILIKE '%feria%');
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
