const { Client } = require('ssh2');

const script = `
cat << 'EOF' > /var/www/universomerchan/check-colors.ts
import { db } from "./src/lib/database";

const map = {
    // English
    black: "#222222", white: "#F8F8F8", blue: "#1E40AF", red: "#DC2626",
    green: "#15803D", yellow: "#EAB308", orange: "#EA580C", pink: "#EC4899",
    purple: "#7C3AED", grey: "#6B7280", gray: "#6B7280", brown: "#78350F",
    navy: "#1E3A5F", silver: "#C0C0C0", gold: "#D4A017", natural: "#F5F0E6",
    beige: "#F5F5DC", transparent: "#E8E8E8", mixed: "linear-gradient(135deg, #A855F7, #EC4899, #FDBA74)",
    // Spanish Standard
    negro: "#222222", blanco: "#F8F8F8", azul: "#1E40AF", rojo: "#DC2626",
    verde: "#15803D", amarillo: "#EAB308", naranja: "#EA580C", rosa: "#EC4899",
    morado: "#7C3AED", purpura: "#7C3AED", gris: "#6B7280", marron: "#78350F",
    marino: "#1E3A5F", plata: "#C0C0C0", oro: "#D4A017", dorado: "#D4A017",
    transparente: "#E8E8E8", mixto: "linear-gradient(135deg, #A855F7, #EC4899, #FDBA74)",
    mezclado: "linear-gradient(135deg, #A855F7, #EC4899, #FDBA74)",
    // Midocean specifics
    ceniza: "#D1D5DB", azul_claro: "#60A5FA", azul_oscuro: "#1E3A8A",
    azul_rey: "#2563EB", azul_marino: "#1E3A8A", celeste: "#38BDF8",
    verde_claro: "#86EFAC", verde_oscuro: "#064E3B", verde_manzana: "#84CC16",
    verde_lima: "#A3E635", naranja_claro: "#FDBA74", burdeos: "#9F1239",
    fucsia: "#C026D3", turquesa: "#0D9488", amarillo_fluor: "#D9F99D",
    verde_fluor: "#86EFAC", naranja_fluor: "#FFEDD5", rosa_fluor: "#FBCFE8",
    naranja_neon: "#F97316", verde_neon: "#86EFAC", rosa_neon: "#FBCFE8", amarillo_neon: "#D9F99D",
    neon: "#A855F7",
    azul_real: "#1D4ED8", lima: "#A3E635", marino_frances: "#1E3A8A", francia: "#1E3A8A",
    magenta: "#D946EF", cian: "#06B6D4", multicolor: "linear-gradient(135deg, #A855F7, #EC4899, #FDBA74)", surtido: "linear-gradient(135deg, #A855F7, #EC4899, #FDBA74)"
};

const extractSingleColor = (token) => {
    let key = token.toLowerCase().trim().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/\\s+/g, "_");
    if (map[key]) return map[key];
    const words = key.split('_');
    if (words.length > 1 && map[words[0]]) return map[words[0]];
    return null;
};

const testColor = (cg) => {
    if (!cg) return null;
    if (cg.includes('/')) {
        const p = cg.split('/');
        for (const c of p) { if (!extractSingleColor(c)) return c; }
        return "OK";
    }
    return extractSingleColor(cg) ? "OK" : cg;
};

async function run() {
    const variants = await db.query.productVariants.findMany({ columns: { colorDescription: true, colorGroup: true }});
    const missing = new Set();
    for (const v of variants) {
        const val = v.colorDescription || v.colorGroup || "";
        const m = testColor(val);
        if (m && m !== "OK") missing.add(m);
    }
    console.log("MISSING_COLORS_START");
    console.log(Array.from(missing).join(", "));
    console.log("MISSING_COLORS_END");
    process.exit(0);
}
run();
EOF
cd /var/www/universomerchan && npx tsx -r dotenv/config check-colors.ts
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(script, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => process.stdout.write(data.toString()))
              .stderr.on('data', data => process.stderr.write(data.toString()));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
