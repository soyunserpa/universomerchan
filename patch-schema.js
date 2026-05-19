const fs = require('fs');
let code = fs.readFileSync('src/lib/schema.ts', 'utf8');

// Insert userFavorites table after users table
const tableCode = `
export const userFavorites = pgTable("user_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userProductIdx: uniqueIndex("user_product_idx").on(table.userId, table.productId),
}));
`;

code = code.replace(
  '// ============================================================\n// ADDRESSES',
  tableCode + '\n// ============================================================\n// ADDRESSES'
);

fs.writeFileSync('src/lib/schema.ts', code);
console.log("Patched schema.ts");
