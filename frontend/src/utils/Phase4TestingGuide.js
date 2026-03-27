/**
 * Phase 4: Frontend Testing Checklist & Manual Test Guide
 * This file provides step-by-step instructions for manual testing
 */

export const PHASE4_FRONTEND_TESTS = {
  
  testDashboardView: {
    name: "Dashboard Produk View",
    steps: [
      "1. Navigate to http://localhost:3000/products",
      "2. Verify page title: '📦 Dashboard Produk'",
      "3. Check that table displays with columns:",
      "   - No Order, NIK, Nama, Bank, Harga, Status, Pembayaran, Actions",
      "4. Verify Refresh button is visible and clickable",
      "5. Check that products load from API (check browser Network tab)",
      "6. Verify row count shows total products"
    ],
    expectedResult: "Dashboard loads with product list in table format",
    debugSteps: [
      "Check browser Console for JS errors",
      "Check Network tab for API failure (GET /api/products)",
      "Verify token is in localStorage",
      "Check if backend is running (http://localhost:5000)"
    ]
  },

  testProductFiltering: {
    name: "Product Filtering & Search",
    steps: [
      "1. From Dashboard, use Status dropdown to filter",
      "   - Select 'Pending' → Should show only pending products",
      "   - Select 'Completed' → Should show only completed products",
      "2. Use Pembayaran dropdown to filter",
      "   - Select 'Lunas' → Should show only paid products (✅)",
      "   - Select 'Belum Lunas' → Should show only unpaid products (⏳)",
      "3. Search by No Order (type in search box)",
      "   - Type a valid order number → Should filter list",
      "4. Search by NIK (type in search box)",
      "   - Type a NIK → Should filter list",
      "5. Search by Nama (type in search box)",
      "   - Type a name → Should filter list",
      "6. Combine filters (Status + Pembayaran)",
      "   - Apply multiple filters at once → Should apply all",
      "7. Clear search → All products should reappear",
      "8. Verify row count updates with filters"
    ],
    expectedResult: "Filters work independently and in combination",
    debugSteps: [
      "Check if filter state is updating (inspect component state in React DevTools)",
      "Verify product array is being filtered correctly"
    ]
  },

  testRefreshButton: {
    name: "Refresh Data",
    steps: [
      "1. Click Refresh button",
      "2. Observe loading spinner briefly",
      "3. Wait for table to repopulate",
      "4. Verify data is fresh from API",
      "5. Check Network tab shows GET /api/products call"
    ],
    expectedResult: "Table reloads with fresh data from API",
    debugSteps: [
      "Check if CircularProgress shows during fetch",
      "Verify API response in Network tab"
    ]
  },

  testProductEdit: {
    name: "Edit Product",
    steps: [
      "1. Click Edit button (✏️ icon) on any product",
      "2. ProductEditForm dialog should open",
      "3. Verify form pre-populated with product data",
      "4. Change Harga to a different value (e.g., 1500000)",
      "5. Observe hint shows formatted currency",
      "6. Change Status to 'in_progress'",
      "7. Toggle 'Sudah Bayar' switch ON → Check hint updates",
      "8. Toggle 'Sudah Bayar' switch OFF → Check hint updates back",
      "9. Click Simpan (Save) button",
      "10. Observe loading state on button",
      "11. Wait for success notification: 'Produk berhasil diperbarui'",
      "12. Dialog should auto-close",
      "13. Return to dashboard",
      "14. Find edited product in table",
      "15. Verify Harga shows with dot separators (1.500.000)",
      "16. Verify Status changed"
    ],
    expectedResult: "Product updates successfully, table refreshes with new values",
    debugSteps: [
      "Check Console for PUT request errors",
      "Verify response in Network tab shows 200 status",
      "Check if Database was updated: query db.products.findById(...)"
    ]
  },

  testPaymentFlow: {
    name: "Record Payment Flow (Main Test)",
    steps: [
      "1. Find a product with Pembayaran = '⏳ Belum'",
      "2. Click Payment button (💳 icon)",
      "3. PaymentReceiverDialog should open",
      "4. Verify product info in blue box:",
      "   - Shows 'Produk: ' and product No Order",
      "   - Shows 'Jumlah: ' and amount in Indonesian format",
      "5. Wait for Rekening dropdown to load (should see spinner momentarily)",
      "6. Click Rekening dropdown",
      "7. Verify list shows all available rekening",
      "8. Select first rekening from list",
      "9. Verify details box appears showing:",
      "   - Saldo Saat Ini (current balance)",
      "   - Bank name",
      "10. Click Payment Method dropdown",
      "11. Verify shows 4 options: Transfer Bank, Tunai, Cek, Lainnya",
      "12. Select 'Transfer Bank'",
      "13. Type optional note in Keterangan field",
      "14. Click 'Terima Pembayaran' (Accept Payment) button",
      "15. Observe loading state",
      "16. Wait for success: 'Pembayaran berhasil dicatat'",
      "17. Dialog closes",
      "18. Dashboard refreshes"
    ],
    expectedResult: "Payment recorded successfully, new ProductPayment AND Cashflow entry created",
    debugSteps: [
      "Check Network tab for POST /api/product-payment call",
      "Verify response status 201 or 200",
      "Check Console for error messages",
      "In MongoDB: db.productpayments.findOne({productId: ObjectId('...')})"
    ]
  },

  testPaymentStatusUpdate: {
    name: "Product Status After Payment",
    steps: [
      "1. After recording payment, return to Dashboard Produk",
      "2. Find the product you just paid",
      "3. Verify Pembayaran column shows '✅ Lunas' (green chip)",
      "4. Verify Payment button (💳) NO LONGER appears for this product",
      "5. Only Edit button should remain"
    ],
    expectedResult: "Product marked as paid in UI and backend",
    debugSteps: [
      "Check if Product.sudahBayar updated to true in MongoDB",
      "Verify Component re-renders after API call completes"
    ]
  },

  testCashflowCardUpdate: {
    name: "Cashflow Cards Update After Payment",
    steps: [
      "1. Go to Cashflow menu (💰 Cashflow sidebar)",
      "2. Select correct Rekening if needed (via dropdown)",
      "3. Observe summary cards at top:",
      "   - Net Profit",
      "   - Total Income", 
      "   - Total Expense",
      "   - Saldo Bersih",
      "4. Check that Total Expense card increased by payment amount",
      "5. Check that Net Profit recalculated (should be: saldoAwal + income - expense)",
      "6. Verify all values show with dot separators (1.000.000)",
      "7. Find cash flow entry in table for the payment",
      "   - Type should be 'expense'",
      "   - Amount should match payment"
    ],
    expectedResult: "Cashflow cards reflect payment automatically",
    debugSteps: [
      "Check /api/summary/overview?rekeningId=xxx returns updated totals",
      "Verify Cashflow entry in database: db.cashflows.findOne({rekeningId: ...})",
      "Check if component re-fetches summary on mount"
    ]
  },

  testValidation: {
    name: "Form Validation",
    steps: [
      "1. Try to edit product with Harga = 0",
      "2. Click Save → Should show error: 'Harga harus lebih dari 0'",
      "3. Try to submit payment WITHOUT selecting Rekening",
      "4. Click 'Terima Pembayaran' button",
      "5. Should show error: 'Pilih rekening terlebih dahulu'",
      "6. Try to click Payment button on already-paid product",
      "7. Should show error: 'Produk ini sudah dibayar'"
    ],
    expectedResult: "All validations work and show appropriate error messages",
    debugSteps: [
      "Check Console for error logs",
      "Verify error state in component triggers Alert display"
    ]
  },

  testNoProducts: {
    name: "Empty State",
    steps: [
      "1. On Dashboard, apply filters to show 0 products",
      "   - Status: pending + Pembayaran: Lunas (unlikely combination)",
      "   - Search for non-existent order",
      "2. Should show Alert: 'Tidak ada produk yang sesuai dengan filter'",
      "3. Table should not display"
    ],
    expectedResult: "Empty state handled gracefully",
    debugSteps: [
      "Check if filteredProducts.length === 0 triggers Alert"
    ]
  },

  testLoadingStates: {
    name: "Loading & Error States",
    steps: [
      "1. Normal load: Page shows CircularProgress spinner while fetching",
      "2. Edit form: Save button shows loading spinner and text 'Menyimpan...'",
      "3. Payment dialog: Rekening dropdown shows spinner while loading",
      "4. Payment submit: Button shows spinner and text 'Mencatat...'",
      "5. Stop backend server",
      "6. Try to load Dashboard Produk",
      "7. Should show error message (not crash)"
    ],
    expectedResult: "Proper loading/error states with user feedback",
    debugSteps: [
      "Check React DevTools for loading state changes",
      "Verify error boundary doesn't crash the app"
    ]
  },

  testResponsiveness: {
    name: "Responsive Design",
    steps: [
      "1. Desktop (1920x1080): All table columns visible",
      "2. Tablet (768px): Table scrolls horizontally, controls responsive",
      "3. Mobile (375px): Table scrollable, stacked layout"
    ],
    expectedResult: "UI adapts to different screen sizes",
    debugSteps: [
      "Use Chrome DevTools device emulation",
      "Check MUI breakpoints (xs, sm, md, lg, xl)"
    ]
  },

  testCurrencyFormatting: {
    name: "Indonesian Currency Formatting",
    steps: [
      "1. In ProductEditForm, enter Harga 1500000",
      "2. Hint should show: 'Rp 1.500.000'",
      "3. In Dashboard table, Harga shows with dots: 'Rp 1.500.000'",
      "4. In Cashflow, all money values use dots",
      "5. In PaymentReceiverDialog, amount shows formatted",
      "6. Rekening balance shows formatted"
    ],
    expectedResult: "All currency values formatted with Indonesian locale",
    debugSteps: [
      "Check Number.toLocaleString('id-ID') is being used",
      "Inspect DOM to verify formatting in rendered output"
    ]
  },

  testErrorRecovery: {
    name: "Error Recovery",
    steps: [
      "1. Close backend server",
      "2. Try to load Dashboard → Error should show",
      "3. Restart backend",
      "4. Click Dashboard again → Should work",
      "5. Try edit during network outage → Should show error",
      "6. Error should not break the app (user can close dialog & try again)"
    ],
    expectedResult: "App recovers gracefully from network errors",
    debugSteps: [
      "Check error handling in try-catch blocks",
      "Verify axios error interceptor configured"
    ]
  }
};

/**
 * Test Execution Summary
 * Track which tests have been completed
 */
export const TEST_SUMMARY = {
  "✅ Dashboard View": false,
  "✅ Product Filtering": false,
  "✅ Refresh Button": false,
  "✅ Product Edit": false,
  "✅ Payment Flow": false,
  "✅ Payment Status": false,
  "✅ Cashflow Update": false,
  "✅ Validation": false,
  "✅ Empty State": false,
  "✅ Loading States": false,
  "✅ Responsiveness": false,
  "✅ Currency Format": false,
  "✅ Error Recovery": false
};

/**
 * Quick Reference for Browser Console Debugging
 */
export const DEBUG_TIPS = `
=== PHASE 4 DEBUGGING TIPS ===

1. CHECK API CALLS
   - Open DevTools → Network tab
   - Filter by Fetch/XHR
   - Watch for GET /api/products, PUT /api/products/:id, POST /api/product-payment
   - Check response status (should be 200/201)

2. CHECK COMPONENT STATE
   - Install React DevTools extension
   - Inspect ProductDashboard component
   - View 'products' state array
   - Check if filtered data is correct

3. CHECK BROWSER CONSOLE
   - Press F12 → Console tab
   - Look for red errors
   - Common issues:
     * "Cannot read property '_id' of undefined" → API response error
     * "401 Unauthorized" → Token missing or invalid
     * "CORS error" → Backend not running or CORS not configured

4. CHECK NETWORK CONNECTIVITY
   - curl http://localhost:5000/api/products
   - Should return JSON with products array
   - If not, backend is not running

5. CHECK DATABASE
   - mongosh (connect to MongoDB)
   - use website_aksesoris
   - db.products.find().pretty()
   - db.cashflows.find().pretty()
   - db.productpayments.find().pretty()

6. QUICK TEST
   - Go to Dashboard Produk → Should load instantly
   - Click Edit on first product → Dialog opens
   - Change harga to 999999 → Click Save
   - Check Console for errors
   - If success → Payment test likely will work

7. BACKEND LOGS
   - In backend terminal, watch for:
     * GET /api/products [200] ✅
     * PUT /api/products/:id [200] ✅
     * POST /api/product-payment [201] ✅
   - Watch for [ERROR] or [WARN] messages

8. PAYMENT FLOW DEBUG
   - Record a payment
   - Check: POST /product-payment [201]
   - Check MongoDB: db.productpayments.findOne({_id: ObjectId('...')})
   - Check: db.cashflows.findOne({linkedPaymentId: ObjectId('...')})
   - Check: db.products.findOne({_id: ObjectId('...')}) - sudahBayar should be true
`;

console.log(DEBUG_TIPS);
