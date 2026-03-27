# Phase 4: End-to-End Testing & Verification Guide

## Objective
Test the complete product payment flow from UI to database to cashflow card updates.

## Test Checklist

### Part 1: Backend & Database Setup
- [ ] Start backend server: `npm run dev` (from workspace root)
- [ ] Verify backend running: `http://localhost:5000`
- [ ] Check MongoDB connection in logs
- [ ] Verify all routes mounted: `/api/invoice`, `/api/product-payment`

### Part 2: Frontend Setup
- [ ] Start frontend: `npm start` (from frontend folder)
- [ ] Login with valid credentials
- [ ] Verify sidebar shows "Dashboard Produk" menu
- [ ] No console errors in browser DevTools

### Part 3: Product Dashboard Tests
**Test 3.1: View Products**
- [ ] Navigate to Dashboard Produk (`/products`)
- [ ] Page loads without errors
- [ ] Displays list of products in table
- [ ] Table columns visible: No Order, NIK, Nama, Bank, Harga, Status, Pembayaran, Actions

**Test 3.2: Filter & Search**
- [ ] Status dropdown filters products
- [ ] Pembayaran dropdown filters by paid/unpaid
- [ ] Search by No Order works
- [ ] Search by NIK works
- [ ] Search by Nama works
- [ ] Row count updates with filters
- [ ] Multiple filters combined work

**Test 3.3: Refresh Button**
- [ ] Click Refresh button
- [ ] Table reloads data from API
- [ ] Loading spinner appears briefly

### Part 4: Product Edit Tests
**Test 4.1: Open Edit Dialog**
- [ ] Click Edit button on a product
- [ ] ProductEditForm dialog opens
- [ ] Form pre-populated with product data
- [ ] Harga field shows currency formatting hint

**Test 4.2: Edit Fields**
- [ ] Edit Harga field
  - [ ] Value updates in real-time
  - [ ] Hint shows formatted currency
  - [ ] Accepts values > 0
- [ ] Click Status dropdown
  - [ ] Shows all 4 options (pending, in_progress, completed, cancelled)
- [ ] Toggle Sudah Bayar switch
  - [ ] Updates label text
  - [ ] Hint changes based on state

**Test 4.3: Save Product**
- [ ] Click Simpan button
- [ ] Loading state shows
- [ ] Success notification appears: "Produk berhasil diperbarui"
- [ ] Dialog closes
- [ ] Table refreshes with updated data
- [ ] Harga displays with dot separators (1.000.000)

### Part 5: Payment Recording Tests
**Test 5.1: Open Payment Dialog**
- [ ] Find a product with Pembayaran = "⏳ Belum"
- [ ] Click Payment button (💳 icon)
- [ ] PaymentReceiverDialog opens
- [ ] Shows product info box with No Order and Harga
- [ ] Rekening dropdown loads (show loading spinner briefly)

**Test 5.2: Select Rekening**
- [ ] Click Rekening dropdown
- [ ] Lists all available rekening (Rekening A, Rekening B, etc)
- [ ] Select one rekening
- [ ] Details box appears showing:
  - [ ] Saldo Saat Ini (current balance)
  - [ ] Bank name
- [ ] Multiple selections work

**Test 5.3: Payment Method**
- [ ] Click Payment Method dropdown
- [ ] Shows 4 options: Transfer Bank, Tunai, Cek, Lainnya
- [ ] Can select each option

**Test 5.4: Notes Field**
- [ ] Type optional notes
- [ ] Placeholder text visible: "Contoh: Pembayaran untuk order #001..."
- [ ] Multiline input works

**Test 5.5: Submit Payment**
- [ ] Click "Terima Pembayaran" button
- [ ] Loading state shows
- [ ] Success notification: "Pembayaran berhasil dicatat"
- [ ] Dialog closes
- [ ] Table refreshes

### Part 6: Database Verification
**Test 6.1: Check ProductPayment Creation**
```
db.productpayments.findOne({productId: ObjectId("...")})
```
Should show:
- [ ] productId matches edited product
- [ ] rekeningId matches selected rekening
- [ ] amount equals product harga
- [ ] status = "pending"
- [ ] createdBy = current user
- [ ] timestamps present (createdAt, updatedAt)

**Test 6.2: Check Cashflow Entry Creation**
```
db.cashflows.findOne({linkedPaymentId: ObjectId("...")})
```
Should show:
- [ ] type = "expense"
- [ ] amount equals product harga
- [ ] rekeningId matches selected rekening
- [ ] description contains product info
- [ ] status = "recorded" or "confirmed"
- [ ] auditLog shows creation by user

**Test 6.3: Check Product Update**
```
db.products.findById(ObjectId("..."))
```
Should show:
- [ ] sudahBayar = true
- [ ] paymentDate = current date/time
- [ ] updated timestamps

### Part 7: Cashflow Card Updates
**Test 7.1: Navigate to Cashflow**
- [ ] Go to Cashflow menu
- [ ] View summary cards (Net Profit, Total Income, Total Expense, Saldo Bersih)

**Test 7.2: Check Card Values**
- [ ] Total Expense card increased by payment amount
- [ ] Net Profit card updated (saldoAwal + income - expense)
- [ ] Values display with dot separators
- [ ] Correct rekening selected in dropdown

**Test 7.3: Account Filtering**
- [ ] Change selected account (Rekening A → Rekening B)
- [ ] Cards recalculate for that account
- [ ] Expense amount reflects only that account's payments

### Part 8: Payment Status Tracking
**Test 8.1: Product Becomes Paid**
- [ ] Return to Dashboard Produk
- [ ] Find recently paid product
- [ ] Pembayaran chip shows "✅ Lunas" (green)
- [ ] Payment button (💳) no longer appears

**Test 8.2: Invoice Generation (Future)**
- [ ] Check if invoice created (optional for Phase 4)
- [ ] Invoice number format: INV-YYYYMM-XXXXX

### Part 9: Edge Cases & Error Handling
**Test 9.1: Validation**
- [ ] Try to edit product with Harga = 0
  - [ ] Shows error: "Harga harus lebih dari 0"
- [ ] Try to submit payment without selecting Rekening
  - [ ] Shows error: "Pilih rekening terlebih dahulu"
- [ ] Try to pay already-paid product
  - [ ] Shows error: "Produk ini sudah dibayar"

**Test 9.2: No Products State**
- [ ] Filter to show zero products
- [ ] Alert displays: "Tidak ada produk yang sesuai dengan filter"

**Test 9.3: Network Errors**
- [ ] Stop backend server
- [ ] Try to load products
- [ ] Error message displays
- [ ] No crashes

### Part 10: UI/UX Tests
**Test 10.1: Responsive Design**
- [ ] Desktop (1920x1080): All columns visible
- [ ] Tablet (768px): Table responsive
- [ ] Mobile (375px): Scrollable table

**Test 10.2: Loading States**
- [ ] Components show loading spinners during API calls
- [ ] Buttons disabled during submission

**Test 10.3: Notifications**
- [ ] Success messages appear and auto-dismiss
- [ ] Error messages clear when first field edited

---

## Test Flow Summary

**Happy Path (All Tests Passing):**
1. Open Dashboard Produk
2. Edit a product (change harga, status)
3. Toggle "Sudah Bayar" to false (unpaid)
4. Click Payment button
5. Select Rekening, choose Payment Method
6. Submit → Success notification
7. Product becomes "✅ Lunas" in table
8. Navigate to Cashflow
9. Total Expense increases by payment amount
10. Net Profit recalculates correctly ✅

---

## Debugging Tips

### Frontend Issues
- Open Chrome DevTools (F12)
- Check Console tab for errors
- Check Network tab for API calls
- Verify axios is using correct backend URL

### Backend Issues
- Check backend logs for errors
- Verify MongoDB connection
- Test API directly: `curl http://localhost:5000/api/products`
- Check user authentication (JWT token)

### Database Issues
- Connect to MongoDB: `mongosh`
- List collections: `show collections`
- Check data: `db.products.find().pretty()`
- Verify indexes: `db.products.getIndexes()`

### Common Issues

| Issue | Solution |
|-------|----------|
| ProductDashboard blank | Check API response in Network tab |
| Payment button disabled | Product might already be paid |
| Cards not updating | Refresh Cashflow page or check selected account |
| Harga showing NaN | Clear browser cache, restart frontend |
| Success message but no data | Check MongoDB if entry was created |

---

## Test Results Summary

After all tests pass, fill this section:

```
✅ Phase 4 Testing Complete

Date: ___________
Tester: __________
Backend: Running ✅ Stop: npm stop
Frontend: Running ✅ Stop: Ctrl+C
Database: Connected ✅

Test Results:
- Part 1 (Backend): ✅ 5/5 passed
- Part 2 (Frontend Setup): ✅ 4/4 passed
- Part 3 (Dashboard): ✅ 6/6 passed
- Part 4 (Edit): ✅ 7/7 passed
- Part 5 (Payment): ✅ 9/9 passed
- Part 6 (Database): ✅ 9/9 passed
- Part 7 (Cashflow Cards): ✅ 6/6 passed
- Part 8 (Status Tracking): ✅ 3/3 passed
- Part 9 (Error Handling): ✅ 6/6 passed
- Part 10 (UI/UX): ✅ 5/5 passed

Total: ✅ 60/60 tests passed

Issues Found:
(list any issues for Phase 5 refinement)

Ready for Production: ✅ YES
```

---

## Next Steps (Phase 5)
1. Fix any issues found in testing
2. Optimize performance if needed
3. Add invoice generation UI
4. Add payment confirmation workflow
5. Deploy to production

