const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const query = `
        -- Tag: Hostelería / Restaurantes
        UPDATE products 
        SET custom_description = COALESCE(custom_description, short_description, '') || ' hosteleria'
        WHERE (
            product_name ILIKE '%delantal%' OR short_description ILIKE '%delantal%' OR product_name ILIKE '%apron%' OR short_description ILIKE '%apron%'
            OR product_name ILIKE '%sacacorchos%' OR short_description ILIKE '%sacacorchos%' OR product_name ILIKE '%corkscrew%' OR short_description ILIKE '%corkscrew%'
            OR product_name ILIKE '%posavasos%' OR short_description ILIKE '%posavasos%' OR product_name ILIKE '%coaster%' OR short_description ILIKE '%coaster%'
            OR product_name ILIKE '%abridor%' OR short_description ILIKE '%abridor%' OR product_name ILIKE '%opener%' OR short_description ILIKE '%opener%'
            OR category_level1 ILIKE '%hosteleria%' OR category_level2 ILIKE '%hosteleria%'
        )
        AND (custom_description IS NULL OR custom_description NOT ILIKE '%hosteleria%');

        -- Tag: Deporte / Gimnasio
        UPDATE products 
        SET custom_description = COALESCE(custom_description, short_description, '') || ' deporte'
        WHERE (
            product_name ILIKE '%deporte%' OR short_description ILIKE '%deporte%' OR product_name ILIKE '%sport%' OR short_description ILIKE '%sport%'
            OR product_name ILIKE '%gym%' OR short_description ILIKE '%gym%' OR product_name ILIKE '%gimnasio%' OR short_description ILIKE '%gimnasio%'
            OR product_name ILIKE '%fitness%' OR short_description ILIKE '%fitness%'
            OR product_name ILIKE '%bidon%' OR short_description ILIKE '%bidon%' OR product_name ILIKE '%bottle%' OR short_description ILIKE '%bottle%'
            OR product_name ILIKE '%microfibra%' OR short_description ILIKE '%microfibra%'
            OR category_level1 ILIKE '%deporte%' OR category_level2 ILIKE '%deporte%'
        )
        AND (custom_description IS NULL OR custom_description NOT ILIKE '%deporte%');

        -- Tag: Tecnología
        UPDATE products 
        SET custom_description = COALESCE(custom_description, short_description, '') || ' tecnologia'
        WHERE (
            product_name ILIKE '%usb%' OR short_description ILIKE '%usb%'
            OR product_name ILIKE '%altavoz%' OR short_description ILIKE '%altavoz%' OR product_name ILIKE '%speaker%' OR short_description ILIKE '%speaker%'
            OR product_name ILIKE '%inalambrico%' OR short_description ILIKE '%inalambrico%' OR product_name ILIKE '%wireless%' OR short_description ILIKE '%wireless%'
            OR product_name ILIKE '%auricular%' OR short_description ILIKE '%auricular%' OR product_name ILIKE '%earphone%' OR short_description ILIKE '%earphone%'
            OR product_name ILIKE '%bluetooth%' OR short_description ILIKE '%bluetooth%'
            OR category_level1 ILIKE '%tecnologia%' OR category_level2 ILIKE '%tecnologia%' OR category_level1 ILIKE '%technology%' OR category_level2 ILIKE '%technology%'
        )
        AND (custom_description IS NULL OR custom_description NOT ILIKE '%tecnologia%');

        -- Tag: Navidad / Invierno
        UPDATE products 
        SET custom_description = COALESCE(custom_description, short_description, '') || ' navidad'
        WHERE (
            product_name ILIKE '%navidad%' OR short_description ILIKE '%navidad%' OR product_name ILIKE '%christmas%' OR short_description ILIKE '%christmas%'
            OR product_name ILIKE '%invierno%' OR short_description ILIKE '%invierno%' OR product_name ILIKE '%winter%' OR short_description ILIKE '%winter%'
            OR product_name ILIKE '%manta%' OR short_description ILIKE '%manta%' OR product_name ILIKE '%blanket%' OR short_description ILIKE '%blanket%'
            OR product_name ILIKE '%gorro lana%' OR short_description ILIKE '%gorro lana%' OR product_name ILIKE '%beanie%' OR short_description ILIKE '%beanie%'
            OR product_name ILIKE '%termo%' OR short_description ILIKE '%termo%' OR product_name ILIKE '%thermo%' OR short_description ILIKE '%thermo%'
        )
        AND (custom_description IS NULL OR custom_description NOT ILIKE '%navidad%');
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
