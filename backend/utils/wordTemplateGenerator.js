const { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, WidthType, AlignmentType, BorderStyle } = require('docx');
const fs = require('fs');
const path = require('path');
const { logger } = require('./audit');

/**
 * Generate Word template for bulk product upload
 * Creates a .docx file with a table containing all required and optional fields
 */
const generateWordTemplate = async () => {
    try {
        logger.info('Generating Word template for bulk upload');

        // Define table headers (field names)
        const headers = [
            'No. Order',
            'Code Agen',
            'Customer',
            'Bank',
            'Grade',
            'Kantor Cabang',
            'NIK',
            'Nama',
            'Nama Ibu Kandung',
            'Tempat/Tanggal Lahir',
            'No. Rekening',
            'No. ATM',
            'Valid Kartu',
            'No. HP',
            'PIN ATM',
            'PIN Mbanking',
            'Password Mbanking',
            'Email',
            'Password Email',
            'Expired',
            'User Mobile',
            'Password Mobile',
            'PIN Mobile',
            'I-Banking',
            'Password IB'
        ];

        // Sample data row
        const sampleData = [
            'ORDER-001',
            'AGENT-001',
            'PT. Contoh Customer',
            'BRI',
            'PREMIUM',
            'CABANG-JAKARTA',
            '3201010101010001',
            'Ahmad Susanto',
            'Siti Aminah',
            'Jakarta, 01 Januari 1990',
            '123456789012',
            '1234567890123456',
            '12/25',
            '081234567890',
            '1234',
            '5678',
            'SecurePass123!',
            'ahmad@example.com',
            'EmailPass456!',
            '2025-12-31',
            'userbrimo',
            'BrimoPass789!',
            '9012',
            '',
            ''
        ];

        // Create table rows
        const tableRows = [];

        // Header row
        const headerCells = headers.map(header =>
            new TableCell({
                children: [new Paragraph({ text: header, alignment: AlignmentType.CENTER })],
                shading: { fill: '4472C4' },
                width: { size: 2500, type: WidthType.DXA }
            })
        );
        tableRows.push(new TableRow({ children: headerCells, tableHeader: true }));

        // Sample data row
        const dataCells = sampleData.map(data =>
            new TableCell({
                children: [new Paragraph({ text: data })],
                width: { size: 2500, type: WidthType.DXA }
            })
        );
        tableRows.push(new TableRow({ children: dataCells }));

        // Empty row for user to fill
        const emptyCells = headers.map(() =>
            new TableCell({
                children: [new Paragraph({ text: '' })],
                width: { size: 2500, type: WidthType.DXA }
            })
        );
        tableRows.push(new TableRow({ children: emptyCells }));

        // Create table
        const table = new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE }
        });

        // Create document
        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        text: 'Template Bulk Upload Produk Bank',
                        heading: 'Heading1',
                        alignment: AlignmentType.CENTER
                    }),
                    new Paragraph({ text: '' }),
                    new Paragraph({
                        text: 'Instruksi Penggunaan:',
                        heading: 'Heading2'
                    }),
                    new Paragraph({
                        text: '1. Isi data produk pada baris kosong di bawah contoh data'
                    }),
                    new Paragraph({
                        text: '2. Satu baris = satu produk'
                    }),
                    new Paragraph({
                        text: '3. Field yang wajib diisi: NIK, Nama, Nama Ibu Kandung, Tempat/Tanggal Lahir, No. Rekening, No. ATM, Valid Thru, No. HP, PIN ATM, Email, Password Email, Expired'
                    }),
                    new Paragraph({
                        text: '4. Field bank-specific (User Mobile, Password Mobile, dll) isi sesuai bank yang dipilih'
                    }),
                    new Paragraph({
                        text: '5. Format NIK: 16 digit angka (contoh: 3201010101010001)'
                    }),
                    new Paragraph({
                        text: '6. Format No. ATM: 16 digit angka (contoh: 1234567890123456)'
                    }),
                    new Paragraph({
                        text: '7. Format Valid Thru: MM/YY (contoh: 12/25)'
                    }),
                    new Paragraph({
                        text: '8. Format Expired: YYYY-MM-DD (contoh: 2025-12-31)'
                    }),
                    new Paragraph({
                        text: '9. Setelah selesai, upload file ini melalui menu Bulk Upload'
                    }),
                    new Paragraph({ text: '' }),
                    new Paragraph({
                        text: 'Tabel Data Produk:',
                        heading: 'Heading2'
                    }),
                    new Paragraph({ text: '' }),
                    table
                ]
            }]
        });

        // Generate buffer
        const buffer = await Packer.toBuffer(doc);

        logger.info('Word template generated successfully', {
            bufferSize: buffer.length,
            headers: headers.length
        });

        return {
            success: true,
            buffer,
            filename: 'template-bulk-upload-produk.docx'
        };

    } catch (error) {
        logger.error('Failed to generate Word template', {
            error: error.message,
            stack: error.stack
        });

        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Generate a bank-specific Word template for bulk upload (List Format)
 */
const generateBankSpecificTemplate = async (bankName) => {
    try {
        const bank = (bankName || '').toUpperCase();
        logger.info(`Generating ${bank} Word template in List format`);

        // Common fields for all banks
        let fields = [
            { label: 'No.ORDER', sample: `ORDER-${bank}-001` },
            { label: 'Code Agen', sample: 'GG' },
            { label: 'Customer', sample: 'PELANGGAN-A' },
            { label: 'Bank', sample: bank || 'BRI' },
            { label: 'Grade', sample: 'VIP' },
            { label: 'Kantor Cabang', sample: 'CABANG-JAKARTA' },
            { label: 'NIK', sample: '3201010101010001' },
            { label: 'Nama', sample: 'NAMA LENGKAP' },
            { label: 'Ibu Kandung', sample: 'NAMA IBU' },
            { label: 'Tempat Tgl Lahir', sample: 'Jakarta, 01-01-1990' },
            { label: 'No.Rek', sample: '1234567890' },
            { label: 'No.ATM', sample: '1234567890123456' },
            { label: 'Valid Kartu', sample: '12/29' },
            { label: 'No.HP', sample: '081234567890' },
            { label: 'Pin ATM', sample: '123456' },
            { label: 'Email', sample: 'user@gmail.com' },
            { label: 'Pass Email', sample: 'pass123' },
            { label: 'Expired', sample: '2026-12-31' }
        ];

        // Specific fields per bank
        if (bank === 'BCA') {
            fields.push(
                { label: 'Kode Akses', sample: 'BCA123' },
                { label: 'Pin M-BCA', sample: '123456' },
                { label: 'BCA-ID', sample: 'USERBCA01' },
                { label: 'Pass BCA-ID', sample: 'PassBca123' },
                { label: 'Pin Transaksi', sample: '123456' }
            );
        } else if (bank === 'OCBC' || bank === 'OCBC NISP') {
            fields.push(
                { label: 'User Nyala', sample: 'NYALA123' },
                { label: 'Password Mobile', sample: 'PassOCBC123' },
                { label: 'PIN Mobile', sample: '123456' },
                { label: 'User I-Banking', sample: 'IBOCBC123' },
                { label: 'Password IB', sample: 'PassIB123' }
            );
        } else {
            // BRI, BNI, Mandiri, Permata
            fields.push(
                { label: 'User Mobile', sample: `USER${bank}01` },
                { label: 'Password Mobile', sample: 'Pass123!' },
                { label: 'PIN Mobile', sample: '123456' },
                { label: 'User I-Banking', sample: 'USERIB01' },
                { label: 'Password IB', sample: 'PassIB123' }
            );
        }

        // Add additional common fields that might be useful
        fields.push(
            { label: 'Foto Ktp', sample: '' },
            { label: 'Foto Selfie', sample: '' }
        );

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `DATA PRODUK - ${bank || 'GENERAL'}`,
                                bold: true,
                                size: 28,
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 300 },
                    }),
                    ...fields.map(field =>
                        new Paragraph({
                            children: [
                                new TextRun({ text: `${field.label}: `, bold: true, size: 22 }),
                                new TextRun({ text: field.sample, size: 22 }),
                            ],
                            spacing: { after: 120 },
                        })
                    ),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "\nCatatan: Silakan ubah data di atas dengan data yang benar. Pastikan format Label: Nilai tetap dipertahankan agar dapat dibaca sistem.",
                                size: 16,
                                italic: true,
                            }),
                        ],
                        spacing: { before: 400 },
                    }),
                ],
            }],
        });

        const buffer = await Packer.toBuffer(doc);
        return {
            success: true,
            buffer,
            filename: `template-upload-${bank.toLowerCase() || 'general'}.docx`
        };
    } catch (error) {
        logger.error(`Error generating ${bankName} Word template`, error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Generate Word document from corrected/extracted product data
 * @param {Array} products Array of product objects
 */
const generateCorrectedWord = async (products) => {
    try {
        logger.info('Generating Corrected Word document', { count: products.length });

        const headers = [
            'No. Order', 'Code Agen', 'Customer', 'Bank', 'Grade', 'Kantor Cabang', 'NIK', 'Nama',
            'Nama Ibu Kandung', 'Tempat/Tanggal Lahir', 'No. Rekening', 'No. ATM',
            'Valid Kartu', 'No. HP', 'PIN ATM', 'Email', 'Password Email', 'Expired',
            'User Mobile', 'Password Mobile', 'PIN Mobile',
            'I-Banking', 'Password IB', 'PIN IB', 'BCA-ID', 'Pass BCA-ID', 'Pin Transaksi',
            'Kode Akses', 'Pin m-BCA', 'PIN Wondr', 'Pass Wondr',
            'User BRImo', 'Pass BRImo', 'User Merchant', 'Pass Merchant'
        ];

        // Mapping from product keys to headers
        const fieldMap = {
            noOrder: 'No. Order', codeAgen: 'Code Agen', customer: 'Customer', bank: 'Bank',
            grade: 'Grade', kcp: 'Kantor Cabang', nik: 'NIK', nama: 'Nama',
            namaIbuKandung: 'Nama Ibu Kandung', tempatTanggalLahir: 'Tempat/Tanggal Lahir',
            noRek: 'No. Rekening', noAtm: 'No. ATM', validThru: 'Valid Kartu', noHp: 'No. HP',
            pinAtm: 'PIN ATM', email: 'Email', passEmail: 'Password Email', expired: 'Expired',
            mobileUser: 'User Mobile', mobilePassword: 'Password Mobile', mobilePin: 'PIN Mobile',
            ibUser: 'I-Banking', ibPassword: 'Password IB', ibPin: 'PIN IB', myBCAUser: 'BCA-ID',
            myBCAPassword: 'Pass BCA-ID', myBCAPin: 'Pin Transaksi', kodeAkses: 'Kode Akses', pinMBca: 'Pin m-BCA',
            pinWondr: 'PIN Wondr', passWondr: 'Pass Wondr', brimoUser: 'User BRImo', brimoPassword: 'Pass BRImo',
            briMerchantUser: 'User Merchant', briMerchantPassword: 'Pass Merchant'
        };

        const tableRows = [];

        // Header row
        const headerCells = headers.map(header =>
            new TableCell({
                children: [new Paragraph({ text: header, alignment: AlignmentType.CENTER })],
                shading: { fill: '4472C4' },
                width: { size: 2500, type: WidthType.DXA }
            })
        );
        tableRows.push(new TableRow({ children: headerCells, tableHeader: true }));

        // Data rows
        products.forEach(p => {
            const dataCells = headers.map(header => {
                // Find matching key for this header
                const key = Object.keys(fieldMap).find(k => fieldMap[k] === header);
                const val = p[key] || '';
                return new TableCell({
                    children: [new Paragraph({ text: String(val) })],
                    width: { size: 2500, type: WidthType.DXA }
                });
            });
            tableRows.push(new TableRow({ children: dataCells }));
        });

        const table = new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE }
        });

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        text: 'Hasil Koreksi Data Bulk Upload',
                        heading: 'Heading1',
                        alignment: AlignmentType.CENTER
                    }),
                    new Paragraph({ text: '' }),
                    table
                ]
            }]
        });

        const buffer = await Packer.toBuffer(doc);
        return { success: true, buffer, filename: `hasil-koreksi-${Date.now()}.docx` };

    } catch (error) {
        logger.error('Failed to generate Corrected Word', { error: error.message });
        return { success: false, error: error.message };
    }
};

/**
 * Generate Word document from corrected/extracted product data (List Format)
 * @param {Array} products Array of product objects
 */
const generateCorrectedWordList = async (products) => {
    try {
        logger.info('Generating Corrected Word List document', { count: products.length });

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
            { key: 'myBCAPin', label: 'Pin Transaksi' },
            { key: 'kodeAkses', label: 'Kode Akses' },
            { key: 'pinMBca', label: 'Pin m-BCA' },
            { key: 'pinWondr', label: 'PIN Wondr' },
            { key: 'passWondr', label: 'Pass Wondr' },
            { key: 'brimoUser', label: 'User BRImo' },
            { key: 'brimoPassword', label: 'Pass BRImo' },
            { key: 'briMerchantUser', label: 'User Merchant' },
            { key: 'briMerchantPassword', label: 'Pass Merchant' }
        ];

        const sections = products.map((p, idx) => {
            return {
                properties: {
                    type: idx === 0 ? undefined : 'nextPage'
                },
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `HASIL KOREKSI DATA - PRODUK ${idx + 1}`,
                                bold: true,
                                size: 28,
                                color: '2E75B6'
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                    }),
                    ...fields.map(field => {
                        const val = p[field.key] || '-';
                        return new Paragraph({
                            children: [
                                new TextRun({ text: `${field.label}: `, bold: true, size: 22 }),
                                new TextRun({ text: String(val), size: 22 }),
                            ],
                            spacing: { after: 120 },
                        });
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "\nCatatan: Dokumen ini telah distandardisasi oleh sistem.",
                                size: 16,
                                italic: true,
                                color: '808080'
                            }),
                        ],
                        spacing: { before: 400 },
                    }),
                ]
            };
        });

        const doc = new Document({
            sections: sections
        });

        const buffer = await Packer.toBuffer(doc);
        return { success: true, buffer, filename: `corrected-list-${Date.now()}.docx` };

    } catch (error) {
        logger.error('Failed to generate Corrected Word List', { error: error.message });
        return { success: false, error: error.message };
    }
};

module.exports = {
    generateWordTemplate,
    generateBankSpecificTemplate,
    generateCorrectedWord,
    generateCorrectedWordList
};
