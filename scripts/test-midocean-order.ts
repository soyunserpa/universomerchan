import * as midoceanApi from '../src/lib/midocean-api';

async function checkProof() {
    try {
        const details = await midoceanApi.getOrderDetails('3777171');
        console.log(JSON.stringify(details, null, 2));
    } catch (e: any) {
        console.error(e.message);
    }
}
checkProof();
