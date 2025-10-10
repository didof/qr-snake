// build-data-url.js
// Final version:
// 1. Aggressively minifies the source HTML.
// 2. URL-encodes the result.
// 3. Wraps it in a `data:text/html` URL.
// 4. Generates the QR code from this Data URL.

const fs = require('fs');
const QRCode = require('qrcode');
const { minify } = require('html-minifier-terser');

const inputFile = process.argv[2];
if (!inputFile) {
    console.error('Error: An input HTML file must be provided.');
    console.error('Usage: node build-data-url.js <your_file.html>');
    process.exit(1);
}

const minifyOptions = {
    collapseWhitespace: true,
    removeOptionalTags: true,
    removeComments: true,
    minifyJS: true,
    minifyCSS: true,
    minifyURLs: true,
};

const qrCodeFile = 'qrcode.png';

async function build() {
    try {
        console.log(`[1/3] Reading and aggressively minifying source file...`);
        const sourceHtml = fs.readFileSync(inputFile, 'utf8');
        const minifiedHtml = await minify(sourceHtml, minifyOptions);

        console.log(`[2/3] URL-encoding and creating Data URL...`);
        const encodedContent = encodeURIComponent(minifiedHtml);
        const dataUrl = `data:text/html;charset=UTF-8,${encodedContent}`;
        
        const finalSize = dataUrl.length;
        console.log(`Final payload size for QR Code: ${finalSize} characters.`);

        if (finalSize > 2953) {
             console.warn(`\nWarning: Payload is very large. QR code will be extremely dense and may be difficult to scan.`);
        }

        console.log(`[3/3] Creating QR code image...`);
        await QRCode.toFile(qrCodeFile, dataUrl, {
            errorCorrectionLevel: 'L', // Low ECC for maximum data capacity
        });

        console.log(`\nProcess complete. QR code saved to "${qrCodeFile}"`);

    } catch (error) {
        console.error(`\nAn error occurred during the build process:`, error);
        if (error.message.includes('data is too long')) {
            console.error('--> Failure cause: The final Data URL is still too large to fit in a QR code.');
        }
        process.exit(1);
    }
}

build();