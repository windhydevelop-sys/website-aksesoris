# Testing Guide: Input Detail Rekening A & B 🧪

**Date**: 8 March 2026  
**Version**: 1.0.0  

---

## Pre-Test Checklist

- [ ] Backend server running (`npm start` in backend folder)
- [ ] Frontend server running (`npm start` in frontend folder)
- [ ] MongoDB connected
- [ ] User logged in to app
- [ ] Browser DevTools open (F12) for debugging
- [ ] Clean browser cache (optional but recommended)

---

## Test Setup

1. **Backend Terminal** (Port 5000)
```bash
cd backend
npm start
# Expected: "Server running on port 5000"
# Check for: "mongodb connected"
```

2. **Frontend Terminal** (Port 3000)
```bash
cd frontend
npm start
# Expected: "Compiled successfully!"
```

3. **Browser**
- Navigate to: `http://localhost:3000`
- Login with existing account
- Open CashflowManagement page

---

## Test 1: Verify Components Loaded

### Steps
1. Open CashflowManagement page
2. Locate **Account Tabs** (should see Tabs for Rekening A & B)
3. Below tabs, should see **Account Detail Panel** ← NEW

### Expected Result
```
┌─ Account Tabs ─────────────────────┐
│ [Rekening A(Utama)] [Rekening B]   │
└─────────────────────────────────────┘

┌─ Detail Panel (Empty State) ────────┐
│ ℹ️  Detail Rekening A Belum Diatur  │
│                                     │
│   [Atur Detail Rekening]            │
└─────────────────────────────────────┘

┌─ Summary Cards ────────────────────┐
│ (Total Debit, etc...)              │
└─────────────────────────────────────┘
```

### Troubleshoot
- **Panel not visible**: Check browser console for errors
- **Import error**: Verify RekeningDetailPanel.js exists
- **Missing styles**: Clear cache & hard refresh (Ctrl+Shift+R)

---

## Test 2: Create Rekening A Detail (First Time)

### Steps

1. **Verify Empty State**
   - Should see: "ℹ️  Detail Rekening A Belum Diatur"
   - Should see: "Atur Detail Rekening" button

2. **Click Button**
   - Click: "Atur Detail Rekening"
   - Expected: Dialog pops up with title "Tambah Detail Rekening A"

3. **Fill Form**
   ```
   Nama Bank: Bank Mandiri
   Nomor Rekening: 1234567890
   Nama Pemilik: PT. Aksesoris Indonesia
   Cabang: Jakarta Pusat
   Saldo Awal: 5000000
   Tipe Rekening: Tabungan
   Mata Uang: IDR
   Status: Aktif
   Keterangan: Rekening utama untuk operasional harian
   ```

4. **Submit**
   - Click: "Simpan" button
   - Wait for response

5. **Verify Created**
   - Dialog closes
   - Detail panel now shows detail info instead of empty state
   - Should display:
     - 🏦 Bank Mandiri
     - PT. Aksesoris Indonesia
     - Status: ✓ Aktif (green)
     - Nomor Rekening: 1234567890
     - Saldo Awal: Rp 5,000,000
     - Saldo Terkini: Rp 5,000,000

### Browser Console Checks

**Network Tab**:
```
POST /api/rekening
Status: 201
Response body shows all fields with _id
```

**MongoDB Verification**:
```javascript
// In MongoDB shell:
db.rekening_details.findOne({account: 'Rekening A'})
// Should return full document
```

---

## Test 3: View & Verify Details

### Steps
1. Stay on Rekening A tab
2. Look at RekeningDetailPanel
3. Verify all details displayed correctly:
   - Bank icon (🏦) + bank name
   - Owner name
   - Green status chip "✓ Aktif"
   - Account number (partially masked or full)
   - Cabang
   - Saldo Awal & Terkini with currency formatting
   - Tipe Rekening: Tabungan
   - Mata Uang: IDR
   - Date updated
   - Description/keterangan

### Expected Format
```
🏦 Bank Mandiri        [✓ Aktif] [Edit]
PT. Aksesoris Indonesia

Nomor Rekening        Cabang
1234567890            Jakarta Pusat

Saldo Awal            Tipe Rekening
Rp 5,000,000          Tabungan

Saldo Terkini         Mata Uang
Rp 5,000,000          IDR
Update: 8/3/2026

Keterangan:
Rekening utama untuk operasional harian
```

---

## Test 4: Edit Rekening A Detail

### Steps

1. **Verify Edit Button**
   - Should see: "Edit" button next to status chip

2. **Click Edit**
   - Click: "Edit" button
   - Expected: Dialog opens with title "Edit Detail Rekening A"
   - Form should be pre-filled with current values

3. **Verify Pre-Filled Data**
   - Nama Bank: "Bank Mandiri" ✓
   - Nomor Rekening: "1234567890" ✓
   - Nama Pemilik: "PT. Aksesoris Indonesia" ✓
   - All other fields pre-filled ✓

4. **Make Changes**
   - Change Cabang: "Jakarta Pusat" → "Jakarta Selatan"
   - Change Saldo Awal: "5000000" → "8000000"
   - Change Keterangan: Add " [UPDATED]"

5. **Submit Changes**
   - Click: "Perbarui" button
   - Wait for response

6. **Verify Updates**
   - Dialog closes
   - Panel re-renders with new values:
     - Cabang: Jakarta Selatan ✓
     - Saldo Awal: Rp 8,000,000 ✓
     - Keterangan: shows "[UPDATED]" ✓

### Network Validation
```
PUT /api/rekening/account/Rekening%20A
Status: 200
Response: { success: true, data: {...updated fields...} }
```

---

## Test 5: Create Rekening B Detail

### Steps

1. **Switch Tab**
   - Click: "Rekening B" tab
   - Expected: Active tab changes to B

2. **Verify Empty State**
   - Should see: "ℹ️  Detail Rekening B Belum Diatur"
   - Different button: "Atur Detail Rekening"

3. **Create Detail for B**
   - Click: "Atur Detail Rekening"
   - Fill different values:
   ```
   Nama Bank: Bank BCA
   Nomor Rekening: 9876543210
   Nama Pemilik: PT. Aksesoris Indonesia
   Cabang: Jakarta Pusat Cabang 2
   Saldo Awal: 3000000
   Tipe Rekening: Giro
   Mata Uang: IDR
   Status: Aktif
   Keterangan: Rekening alternatif untuk pembayaran
   ```

4. **Submit**
   - Click: "Simpan"

5. **Verify Saved**
   - Detail panel shows Rekening B info:
     - 🏦 Bank BCA ✓
     - Nomor: 9876543210 ✓
     - Saldo Awal: Rp 3,000,000 ✓
     - Tipe: Giro ✓

### Expected - ReckeningB Styling
```
Panel background: Should be slightly different color
(Light blue/info color instead of primary)
Indicates it's Account B
```

---

## Test 6: Switch Between Accounts

### Steps

1. **Current State**: Viewing Rekening B detail

2. **Click Tab A**
   - Click: "Rekening A" tab
   - Expected: Panel updates immediately
   - Should show Bank Mandiri details
   - Should show our edited values (Jakarta Selatan, Rp 8,000,000)

3. **Verify A Details**
   - All values match what we edited ✓

4. **Click Tab B**
   - Click: "Rekening B" tab
   - Expected: Panel updates to show Bank BCA
   - Should show: 9876543210, Rp 3,000,000

5. **Rapid Switching**
   - Click A → B → A → B
   - No errors or flickering
   - Data always correct for active tab
   - Loading state briefly shows if API slow

### Performance Check
- Tab switch should be instant (< 500ms)
- No duplicate API calls
- Correct data always displayed

---

## Test 7: Verify Both Accounts in API

### Browser DevTools Network Tab

1. **Create/Edit Calls**
   - Filter by "rekening"
   - Should see:
     - `POST /api/rekening` (Create A)
     - `POST /api/rekening` (Create B)
     - `PUT /api/rekening/account/Rekening%20A` (Edit A)

2. **Fetch Calls**
   - When tab switches, should see:
     - `GET /api/rekening/account/Rekening%20A`
     - `GET /api/rekening/account/Rekening%20B`

3. **Response Status**
   - All should be `201` (POST), `200` (GET/PUT)
   - No `4xx` or `5xx` errors

---

## Test 8: MongoDB Data Verification

### MongoDB Shell Commands

```javascript
// Connect to MongoDB
use website_aksesoris_db  // or your db name

// Check all rekening details
db.rekening_details.find({}).pretty()

// Output should show 2 documents:
// 1. account: 'Rekening A', namaBank: 'Bank Mandiri'
// 2. account: 'Rekening B', namaBank: 'Bank BCA'

// Check unique fields
db.rekening_details.find({}, {nomorRekening: 1, account: 1}).pretty()
// Should show:
// { _id: ..., nomorRekening: '1234567890', account: 'Rekening A' }
// { _id: ..., nomorRekening: '9876543210', account: 'Rekening B' }

// Verify userId for security
db.rekening_details.findOne({account: 'Rekening A'})
// Check: userId matches logged-in user
```

---

## Test 9: Error Handling

### Test 9a: Missing Required Fields

1. **Open Create Dialog**
   - Click: "Atur Detail Rekening" for Rekening B (or create new)

2. **Leave Fields Empty**
   - Nama Bank: (empty)
   - Nomor Rekening: (empty)
   - Nama Pemilik: (empty)

3. **Try Submit**
   - Click: "Simpan"

4. **Expected Error**
   - Browser alert: "Nama Bank, Nomor Rekening, dan Nama Pemilik wajib diisi"
   - Form stays open
   - Fields remain unchanged

---

### Test 9b: Duplicate Nomor Rekening

1. **Try Create Similar**
   - Create new rekening with same nomor as Rekening A
   - Nomor: 1234567890 (same as Rekening A)

2. **Try Submit**
   - Click: "Simpan"

3. **Expected Error**
   - Alert: "Nomor rekening sudah terdaftar"
   - Form stays open

---

## Test 10: Status Changes

### Steps

1. **Edit Rekening A**
   - Click: "Edit" on Rekening A detail
   - Change Status: from "Aktif" to "Nonaktif"

2. **Submit**
   - Click: "Perbarui"

3. **Verify Status Changed**
   - Panel updates
   - Status chip changes to red: "✕ Nonaktif"
   - Layout adjusts if needed

4. **Change Back**
   - Edit again
   - Status: "Nonaktif" → "Aktif"
   - Chip returns to green: "✓ Aktif"

---

## Test 11: Currency Selection

### Steps

1. **Create New Detail (or Edit)**
   - Open: Rekening A edit dialog

2. **Change Currency**
   - Mata Uang: "IDR" → "USD"

3. **Verify**
   - Submit changes
   - Panel shows: "Mata Uang: USD"

4. **Try Other Currencies**
   - Edit: change to "EUR"
   - Verify: displays correctly
   - Edit: change to "SGD"
   - Verify: displays correctly

5. **Return to IDR**
   - Set back to: "IDR"

---

## Test 12: Content Formatting

### Verify All Fields Format Correctly

1. **Currency Formatting**
   - Saldo displayed: "Rp X,XXX,XXX" (with dots)
   - Not: "5000000" (no formatting)

2. **Date Formatting**
   - Shows: "8/3/2026" or locale-specific format
   - Shows update timestamp

3. **Text Truncation**
   - Long descriptions don't break layout
   - Uses multiline if needed

4. **Special Characters**
   - Icons display: 🏦, ✓, ✕
   - Text with special chars (e.g., "PT. Co") displays fine

---

## Test 13: Integration with CashflowManagement

### Verify Panel Doesn't Break Existing Features

1. **Tabs Still Work**
   - Account tabs functional ✓
   - Tab switching filters transactions ✓

2. **Summary Cards Show**
   - Below detail panel ✓
   - Show correct totals ✓

3. **Transaction Table**
   - Still visible ✓
   - Transactions recorded correctly ✓

4. **Journal Table**
   - Still functional ✓
   - Shows debit/credit ✓

5. **Create Transaction**
   - "Tambah Transaksi" button works ✓
   - Form still appears ✓
   - Transactions saved correctly ✓

---

## Test 14: Edge Cases

### Edge Case 1: Very Large Saldo
```
Saldo: 999999999999
Expected: "Rp 999,999,999,999" (formatted)
```

### Edge Case 2: Zero Saldo
```
Saldo: 0
Expected: "Rp 0" (not blank)
```

### Edge Case 3: Negative Saldo
```
Saldo: -500000
Expected: "Rp -500,000" (show negative)
```

### Edge Case 4: Very Long Text
```
Keterangan: "Lorem ipsum dolor sit amet consectetur..."
Expected: Panel doesn't break, text wraps
```

### Edge Case 5: Rapid Tab Switching
```
Click A → B → A → B → A (quickly)
Expected: No race condition, correct data always shown
```

---

## Test 15: Post-View Restrictions

### Verify Cannot See Other User's Data

1. **Logout**
   - Click: Logout

2. **Login as Different User**
   - Use different account

3. **Open CashflowManagement**
   - No rekening detail should show
   - Empty state appears

4. **Create New Detail**
   - Create for Rekening A
   - Should only see this new detail
   - Previous user's detail NOT visible ✓

---

## Test 16: Browser Compatibility

### Test on Different Browsers (if available)

- [ ] Chrome/Chromium: ✓
- [ ] Firefox: ✓
- [ ] Safari: ✓
- [ ] Edge: ✓

**Expected**: Styling looks same, no console errors

---

## Success Metrics

| Metric | Expected | Status |
|--------|----------|--------|
| Panel appears on page | Yes | _____ |
| Create detail works | Yes | _____ |
| Detail displays | Yes | _____ |
| Edit works | Yes | _____ |  
| Delete works (future) | Yes | _____ |
| Tab switching correct | Yes | _____ |
| No API errors | 200/201 status | _____ |
| Data persists | Yes | _____ |
| Status changes work | Yes | _____ |
| Formatting correct | Yes | _____ |
| No console errors | 0 errors | _____ |
| Validation works | Yes | _____ |
| Other features unbroken | Yes | _____ |

---

## Debugging Checklist

- [ ] Open DevTools (F12)
- [ ] Check Console for errors
- [ ] Check Network for failed requests
- [ ] Check Response body for error details
- [ ] Verify MongoDB data persisted
- [ ] Check request/response headers
- [ ] Test with fresh browser cache
- [ ] Verify backend is running
- [ ] Verify frontend is running
- [ ] Check MongoDB is connected

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Panel not visible | Hard refresh: Ctrl+Shift+R |
| 404 from API | Backend route not registered in server.js |
| Form not submitting | Check required fields filled |
| Data not persisting | Check MongoDB connection |
| Styling broken | Clear CSS cache |
| Tab not switching | Check selectedAccount state |
| Error 500 | Check backend logs for exception |

---

## Test Completion

- [ ] All 16 tests passed
- [ ] No errors in console
- [ ] All API calls successful
- [ ] MongoDB data verified
- [ ] Other features still working
- [ ] UI displays correctly
- [ ] Performance acceptable
- [ ] No security issues found

---

## Sign-Off

**Date Tested**: _____________  
**Tester Name**: _____________  
**Browser/Version**: _____________  
**Status**: ✅ PASSED / ❌ FAILED / ⚠️ PARTIAL

**Notes**:
```
[Space for additional notes]




```

---

**Next Steps After Testing**:
1. If all pass: Ready for deployment ✅
2. If issues found: Document & fix  
3. Regression test with cashflow transactions
4. User UAT (User Acceptance Testing)
5. Production deployment

---

**Test Date**: 8 March 2026  
**Version**: 1.0.0  
**Ready for**: Development Team Review
