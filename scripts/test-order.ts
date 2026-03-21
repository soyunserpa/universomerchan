import * as midoceanApi from '../src/lib/midocean-api';

async function runTestOrder() {
    console.log("=== STARTING MIDOCEAN E2E TEST (MOCKED PAYLOAD) ===");

    const payload: midoceanApi.MidoceanOrderRequest = {
        order_header: {
            preferred_shipping_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
            currency: "EUR",
            contact_email: "digitalsupport@midocean.com",
            check_price: "false",
            shipping_address: {
                contact_name: "Universomerchan Test",
                company_name: "Universomerchan SL",
                street1: "Calle Falsa 123",
                postal_code: "28001",
                city: "Madrid",
                region: "",
                country: "ES",
                email: "digitalsupport@midocean.com",
                phone: "600000000",
            },
            po_number: `TEST-${Date.now()}`,
            timestamp: new Date().toISOString(),
            contact_name: "Universomerchan Test",
            order_type: "SAMPLE",
            express: "false",
        },
        order_lines: [
            {
                order_line_id: "10",
                sku: "KC3314-32",
                quantity: "1",
                expected_price: "0",
            }
        ]
    };

    console.log(`[TEST] Submitting mock SAMPLE payload to Midocean API...`);
    try {
        const result = await midoceanApi.createOrder(payload);
        console.log("[TEST] SUCCESS! Response:");
        console.log(JSON.stringify(result, null, 2));
    } catch (error: any) {
        console.error("[TEST] FAILED:", error.message);
    }
}

runTestOrder().catch(console.error).finally(() => process.exit(0));
