const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const query = `
        WITH search AS (
            SELECT 
                master_code,
                product_name,
                short_description,
                (setweight(to_tsvector('spanish', unaccent(coalesce(product_name, ''))), 'A') || 
                setweight(to_tsvector('spanish', unaccent(coalesce(category_level1, ''))), 'B') ||
                setweight(to_tsvector('spanish', unaccent(coalesce(short_description, ''))), 'C') ||
                setweight(to_tsvector('spanish', unaccent(coalesce(material, ''))), 'D')) as fts,
                websearch_to_tsquery('spanish', unaccent('chaleco')) as query,
                word_similarity(unaccent('chaleco'), unaccent(product_name)) as trigram
            FROM products
            WHERE master_code IN ('MO2963', 'S04020')
        )
        SELECT 
            master_code,
            product_name,
            ts_rank(fts, query) as ts_rank_score,
            trigram as trigram_score,
            ts_rank(fts, query) + COALESCE(trigram, 0) as total_score
        FROM search;
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
