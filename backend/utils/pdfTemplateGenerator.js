const puppeteer = require('puppeteer');
const { logger } = require('./audit');

/**
 * Generate PDF from corrected/extracted product data
 * @param {Array} products Array of product objects
 * @param {String} format 'table' or 'list'
 */
const generateCorrectedPDF = async (products, format = 'table') => {
    let browser;
    try {
        logger.info('Generating Corrected PDF document', { count: products.length, format });

        const fields = [
            { key: 'noOrder', label: 'No. Order' },
            { key: 'codeAgen', label: 'Code Agen' },
            { key: 'customer', label: 'Customer' },
            { key: 'bank', label: 'Bank' },
            { key: 'grade', label: 'Grade' },
            { key: 'kcp', label: 'Kantor Cabang' },
            { key: 'nik', label: 'NIK' },
            { key: 'nama', label: 'Nama' },
            { key: 'namaIbuKandung', label: 'Nama Ibu Kandung' },
            { key: 'tempatTanggalLahir', label: 'Tempat/Tanggal Lahir' },
            { key: 'noRek', label: 'No. Rekening' },
            { key: 'noAtm', label: 'No. ATM' },
            { key: 'validThru', label: 'Valid Kartu' },
            { key: 'noHp', label: 'No. HP' },
            { key: 'pinAtm', label: 'PIN ATM' },
            { key: 'email', label: 'Email' },
            { key: 'passEmail', label: 'Password Email' },
            { key: 'mobileUser', label: 'User Mobile' },
            { key: 'mobilePassword', label: 'Password Mobile' },
            { key: 'mobilePin', label: 'PIN Mobile' },
            { key: 'ibUser', label: 'I-Banking' },
            { key: 'ibPassword', label: 'Password IB' },
            { key: 'ibPin', label: 'PIN IB' },
            { key: 'myBCAUser', label: 'BCA-ID' },
            { key: 'myBCAPassword', label: 'Pass BCA-ID' },
            { key: 'myBCAPin', label: 'Pin Transaksi' }
        ];

        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; color: #333; }
                h1 { text-align: center; color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
                .footer { text-align: center; font-size: 10px; color: #777; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
                
                /* Table Styles */
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; table-layout: fixed; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                th { background-color: #f8f9fa; font-weight: bold; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                
                /* List Styles */
                .product-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 30px; page-break-after: always; }
                .product-card:last-child { page-break-after: auto; }
                .product-header { background-color: #007bff; color: white; padding: 10px; border-radius: 4px; margin-bottom: 15px; font-weight: bold; }
                .field-row { display: flex; border-bottom: 1px solid #eee; padding: 8px 0; }
                .field-label { width: 200px; font-weight: bold; color: #555; }
                .field-value { flex: 1; }
            </style>
        </head>
        <body>
            <h1>Hasil Koreksi Data Bulk Upload</h1>
        `;

        if (format === 'table') {
            html += `
            <table>
                <thead>
                    <tr>
                        <th style="width: 30px">No</th>
                        ${fields.slice(0, 10).map(f => `<th>${f.label}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${products.map((p, idx) => `
                        <tr>
                            <td>${idx + 1}</td>
                            ${fields.slice(0, 10).map(f => `<td>${p[f.key] || '-'}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <p style="font-size: 12px; margin-top: 20px;">* Tabel di atas hanya menampilkan 10 kolom utama. Gunakan format List untuk detail lengkap per produk.</p>
            `;
        } else {
            html += products.map((p, idx) => `
                <div class="product-card">
                    <div class="product-header">PRODUK ${idx + 1} - ${p.nama || 'Tanpa Nama'}</div>
                    ${fields.map(f => `
                        <div class="field-row">
                            <div class="field-label">${f.label}</div>
                            <div class="field-value">${p[f.key] || '-'}</div>
                        </div>
                    `).join('')}
                </div>
            `).join('');
        }

        html += `
            <div class="footer">
                <p>Dokumen ini dihasilkan secara otomatis oleh sistem pada ${new Date().toLocaleString('id-ID')}</p>
            </div>
        </body>
        </html>
        `;

        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'domcontentloaded' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: format === 'table',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });

        await browser.close();
        return {
            success: true,
            buffer: pdfBuffer,
            filename: `corrected-data-${Date.now()}.pdf`
        };

    } catch (error) {
        if (browser) await browser.close();
        logger.error('Failed to generate Corrected PDF', { error: error.message });
        return { success: false, error: error.message };
    }
};

module.exports = {
    generateCorrectedPDF
};
