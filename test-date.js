const { db } = require('./src/lib/database');
async function run() {
  const order = await db.query.orders.findFirst();
  if (order) {
    console.log(typeof order.createdAt, order.createdAt instanceof Date);
    console.log(typeof order.totalPrice, order.totalPrice);
  }
}
run().catch(console.error);
