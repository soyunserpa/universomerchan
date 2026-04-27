const fs = require('fs');
const sharp = require('sharp');
const ImageTracer = require('imagetracerjs');
const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');

async function testTrace() {
    // create a simple dummy image
    const imgBuffer = await sharp({
        create: {
            width: 200,
            height: 200,
            channels: 4,
            background: { r: 255, g: 0, b: 0, alpha: 1 }
        }
    }).png().toBuffer();

    // get raw pixels
    const { data, info } = await sharp(imgBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    const imgData = {
        width: info.width,
        height: info.height,
        data: data
    };

    // Trace to SVG string
    const svgString = ImageTracer.imagedataToSVG(imgData, { ltres: 1, qtres: 1, pathomit: 8 });
    console.log("Generated SVG length:", svgString.length);

    // Create PDF
    const doc = new PDFDocument();
    const pdfStream = fs.createWriteStream('test-vector.pdf');
    doc.pipe(pdfStream);
    SVGtoPDF(doc, svgString, 0, 0);
    doc.end();

    pdfStream.on('finish', () => {
        console.log("PDF Created!");
    });
}
testTrace().catch(console.error);
