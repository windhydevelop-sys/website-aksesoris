# Analisis Implementasi Product Management & Payment Flow

## Temuan Audit Struktur Existing

### 1. Backend Models & Routes

#### Product Model (`/backend/models/Product.js`)
**Current Fields Available:**
- ✅ `noOrder` - No. Order
- ✅ `nik` - NIK Pelanggan
- ✅ `nama` - Nama Pelanggan
- ✅ `noRek` - No. Rekening Pelanggan
- ✅ `bank` - Bank Pelanggan
- ✅ `status` - Status: ['pending', 'in_progress', 'completed', 'cancelled'] ✅ SUDAH ADA
- ❌ `harga` - TIDAK ADA - Perlu ditambahkan
- ❌ `sudahBayar` - Status pembayaran - TIDAK ADA - Perlu ditambahkan
- ❌ `rekening_id` - Link ke rekening pembayaran - TIDAK ADA - Perlu ditambahkan

#### Endpoints Existing:
- ✅ `GET /api/products` - List products
- ✅ `GET /api/products/:id` - Detail product
- ✅ `PUT /api/products/:id` - Update product (ada, tapi field terbatas)
- ✅ `POST /api/products` - Create product

#### Missing Models:
- ❌ **Invoice** - Belum ada model untuk invoice
- ❌ **ProductPayment** - Belum ada model untuk tracking pembayaran per product

### 2. Frontend Components Existing

#### Components yang sudah ada:
- ✅ `ProductDetail.js` - Viewer detail produk
- ✅ `ProductDetailDialog.js` - Dialog untuk product
- ✅ `OrderManagement.js` - Order management (mungkin ada product list)
- ✅ `PaymentManagement.js` - Payment management (existing)
- ✅ `CashflowManagement.js` - Cashflow tracking (sudah kita setup)

#### Missing Components:
- ❌ **ProductDashboard** - Main dashboard untuk product management
- ❌ **ProductEditForm** - Form untuk edit product dengan: harga, status, pembayaran
- ❌ **PaymentReceiverDialog** - Dialog untuk select rekening & catat pembayaran
- ❌ **InvoiceGenerator** - Untuk generate invoice

### 3. Flow yang Perlu Diimplementasikan

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCT MANAGEMENT FLOW                        │
└─────────────────────────────────────────────────────────────────┘

1. PRODUCT DASHBOARD (List Produk)
   ├─ Show: No Order, Kode ORLAP, NIK, Nama, Bank, Status
   └─ Action: Edit Button → ProductDetailForm

2. EDIT PRODUCT FORM
   ├─ Update Fields:
   │  ├─ Harga [text input]
   │  ├─ Status [dropdown: pending/in_progress/completed]
   │  └─ Sudah Bayar [toggle: Yes/No]
   │
   └─ Conditional Logic:
      ├─ IF Sudah Bayar = YES
      │  └─ Button "Generate Invoice" → Create Invoice & Close Form
      │
      └─ IF Sudah Bayar = NO
         └─ Disable "Generate Invoice" → Redirect to Payment Management

3. PAYMENT MANAGEMENT (Belum Bayar)
   ├─ Show Details:
   │  ├─ No Order
   │  ├─ Kode ORLAP (codeAgen)
   │  ├─ NIK
   │  ├─ Nama
   │  ├─ Bank
   │  └─ Status
   │
   └─ Actions:
      └─ Button "Lunas" → PaymentReceiverDialog

4. PAYMENT RECEIVER DIALOG
   ├─ Select Rekening (Dropdown: Rekening A / Rekening B)
   ├─ Show Amount (dari Product.harga)
   ├─ Button "Terima Pembayaran"
   │
   └─ On Confirm:
      ├─ Create Cashflow Entry (type: 'expense')
      ├─ Update Product.sudahBayar = true
      ├─ Update CashflowManagement cards:
      │  ├─ Total Pengeluaran +harga
      │  ├─ Total Saldo Akhir -harga
      │  └─ Return to Product List
      │
      └─ Show Success Notification

5. INVOICE GENERATION
   ├─ Input: Product ID, Generate Invoice PDF/Word
   ├─ Fields: No Order, Customer, Amount, Bank, Status
   └─ Output: Download Invoice Document
```

## Implementasi Strategy

### PHASE 1: Backend Enhancement
1. **Update Product Model**
   - Add field: `harga` (Number, required: false)
   - Add field: `sudahBayar` (Boolean, default: false)
   - Add field: `rekening_id` (Reference to RekeningDetail)
   - Add field: `invoiceNo` (String, unique)
   - Add field: `invoiceDate` (Date)
   - Add field: `paymentDate` (Date)

2. **Create Invoice Model** (`/backend/models/Invoice.js`)
   ```javascript
   {
     invoiceNo: String (unique),
     productId: ObjectId (ref: Product),
     amount: Number,
     customerName: String,
     bank: String,
     status: 'draft' | 'issued' | 'paid' | 'overdue',
     invoiceDate: Date,
     dueDate: Date,
     paidDate: Date,
     createdBy: User
   }
   ```

3. **Create ProductPayment Model** (`/backend/models/ProductPayment.js`)
   ```javascript
   {
     productId: ObjectId (ref: Product),
     amount: Number,
     rekeningId: ObjectId (ref: RekeningDetail),
     paymentDate: Date,
     cashflowId: ObjectId (ref: Cashflow),
     status: 'pending' | 'confirmed',
     createdBy: User
   }
   ```

4. **Update Products Routes**
   - PUT `/api/products/:id` - Support harga, sudahBayar, rekening_id fields
   - POST `/api/products/:id/mark-paid` - Mark product as paid
   - GET `/api/products?paymentStatus=unpaid` - Filter unpaid products

5. **Create Invoice Routes** (`/backend/routes/invoice.js`)
   - POST `/api/invoice` - Create invoice
   - GET `/api/invoice/:invoiceNo` - Get invoice
   - PUT `/api/invoice/:id` - Update invoice

6. **Create ProductPayment Routes** (`/backend/routes/product-payment.js`)
   - POST `/api/product-payment` - Record payment
   - GET `/api/product-payment/:productId` - Get payment history

### PHASE 2: Frontend - Product Dashboard Component
Create `/frontend/src/components/ProductDashboard.js`
- List semua products
- Show: No Order, NIK, Nama, Bank, Status, Harga, Pembayaran (Lunas/Belum)
- Filter: Status, Pembayaran Status
- Actions: Edit, Bayar

### PHASE 3: Frontend - Product Edit Form
Create `/frontend/src/components/ProductEditForm.js`
- Modal/Dialog untuk edit
- Fields: Harga, Status, Sudah Bayar toggle
- Conditional: IF sudah bayar = YES → Show Invoice Button

### PHASE 4: Frontend - Payment Receiver Dialog
Create `/frontend/src/components/PaymentReceiverDialog.js`
- Select Rekening dropdown
- Show amount
- On confirm: POST to product-payment + update cashflow

### PHASE 5: Invoice Management
Create `/frontend/src/components/InvoiceManagement.js`
- List invoices
- Generate/download invoice
- Track invoice status

## Data Flow Integration dengan Cashflow

```
Product Payment → Create Cashflow Entry
├─ type: 'expense'
├─ category: 'Pembayaran Produk' + Product.noOrder
├─ amount: Product.harga
├─ account: Selected Rekening (A atau B)
├─ reference: Product.noOrder
├─ description: `Pembayaran Produk ${Product.noOrder} - ${Product.nama}`
│
└─ Result:
   ├─ CashflowManagement: Update cards
   ├─ Product: sudahBayar = true
   ├─ Product: paymentDate = now
   └─ Notification: Success message
```

## Priority Implementation Order

1. ✅ **HIGH** - Update Product Model (add harga, sudahBayar, rekening_id)
2. ✅ **HIGH** - Update Products PUT route
3. ✅ **HIGH** - Create ProductDashboard component
4. ✅ **MEDIUM** - Create ProductEditForm component
5. ✅ **MEDIUM** - Create PaymentReceiverDialog component
6. ⏳ **MEDIUM** - Create Invoice Model + Routes
7. ⏳ **LOW** - Create InvoiceManagement component

## Estimasi Total Implementation

- Backend Models & Routes: **2-3 jam**
- Frontend Components: **4-5 jam**
- Testing & Debugging: **2 jam**
- **Total: ~8-10 jam**

---

**Status: Ready for Implementation** ✅
Would you like me to start with Phase 1 (Backend Enhancement)?
