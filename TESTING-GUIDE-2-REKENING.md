# Testing Guide: 2 Rekening Cashflow System 🧪

## Pre-Test Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000
- [ ] MongoDB connected and accessible
- [ ] User logged in to system
- [ ] Browser console open (F12) for debugging

---

## Test 1: Verify Account Tabs Display ✓

### Steps
1. Open CashflowManagement page in browser
2. Scroll below title to find Account Tabs section
3. Verify you see:
   - `💳 Rekening A (Utama)` tab (should be active/highlighted)
   - `💳 Rekening B (Alternatif)` tab
   - Text: "Terpilih: Rekening A - Semua transaksi akan disimpan ke rekening ini"

### Expected Result
```
Tab Component visible with both account options
Active tab indicator on Rekening A
```

### Troubleshoot
If tabs not visible:
- Check browser console for errors
- Verify Material-UI Tabs component imported in CashflowManagement.js
- Clear browser cache (Ctrl+Shift+Delete)

---

## Test 2: Create Transaction in Rekening A

### Steps
1. Ensure Rekening A tab is active (should be default)
2. Click **"Tambah Transaksi"** button
3. Form dialog should open with:
   - Jenis Transaksi: income
   - **Rekening field auto-filled with "Rekening A"** ← KEY CHECK
   - Kategori: (empty, required)
   - Jumlah: (empty, required)
   
4. Fill in form:
   - Jenis: **income**
   - Rekening: **Rekening A** (already filled)
   - Kategori: **Penjualan**
   - Jumlah: **1000000**
   - Tanggal: (today)
   - Metode: **cash**
   - Deskripsi: Test transaksi Rekening A

5. Click **"Buat"** button

### Expected Result
- ✅ Transaction created successfully
- ✅ Toast notification: "Transaksi berhasil dibuat"
- ✅ Table updates with new transaction showing:
  - Jenis: Chip "Pemasukan" (green)
  - **Rekening: Chip "Rekening A" (blue)**
  - Kategori: Penjualan
  - Jumlah: +Rp 1,000,000
  - Tanggal: Today's date

### Browser Console Check
```javascript
// Should see XHR POST to:
POST /api/cashflow
// With request body containing:
{
  type: 'income',
  category: 'Penjualan',
  amount: 1000000,
  account: 'Rekening A',  ← THIS IS KEY
  ...other fields
}

// Response should show account field in saved data
```

### Troubleshoot
If transaction not showing:
- Check Firefox/Chrome DevTools Network tab for API call
- Verify response status 201
- Check MongoDB data: `db.cashflows.findOne({category: 'Penjualan'})`
- Ensure account field is in this data

---

## Test 3: Verify Account Filter Works

### Steps
1. Currently in Rekening A tab (should show the transaction you just created)
2. **Click on "Rekening B" tab**
3. Observe table: should be **EMPTY** (no transactions)
4. Get a notification showing: "Failed to fetch cashflows" or empty state message

### Expected Result
```
When switching to Rekening B:
- Table becomes empty
- Only shows: "No cashflow entries found..."
- Summary cards show zero values
```

### Browser Console Check
```javascript
// Check Network tab for API call:
GET /api/cashflow?account=Rekening%20B
// Should return empty array[]
```

### Troubleshoot
If Rekening B still shows Rekening A data:
- Check if selectedAccount state updating (add console.log)
- Verify dependency array includes selectedAccount in fetchCashflows
- Verify backend GET route has `if (account) query.account = account;`

---

## Test 4: Create Transaction in Rekening B

### Steps
1. Still in Rekening B tab (should be empty)
2. Click **"Tambah Transaksi"** button
3. Form dialog opens - **VERIFY**:
   - Rekening field should show: **"Rekening B"** (auto-filled from selectedAccount)

4. Fill in form:
   - Jenis: **expense**
   - Rekening: **Rekening B** (already filled)
   - Kategori: **Marketing**
   - Jumlah: **500000**
   - Deskripsi: Test expense Rekening B

5. Click **"Buat"**

### Expected Result
- ✅ Transaction created for Rekening B
- ✅ Table now shows 1 transaction:
  - Jenis: "Pengeluaran" (red)
  - **Rekening: "Rekening B" (light blue)**
  - Kategori: Marketing
  - Jumlah: -Rp 500,000

### Verify in MongoDB
```javascript
// In MongoDB shell:
db.cashflows.find({})
// Should show 2 documents:
// 1. account: 'Rekening A', category: 'Penjualan'
// 2. account: 'Rekening B', category: 'Marketing'
```

---

## Test 5: Switch Between Accounts (Data Isolation)

### Steps
1. Click **Rekening A tab**
2. **Verify**: Table shows only "Penjualan" transaction (Rekening A)
3. Click **Rekening B tab**
4. **Verify**: Table shows only "Marketing" transaction (Rekening B)
5. Click back to **Rekening A tab**
6. **Verify**: "Penjualan" transaction appears again

### Expected Result
```
Data isolation working properly:
- Tab A: Only Rekening A transactions displayed
- Tab B: Only Rekening B transactions displayed
- Switch between tabs: data filters correctly each time
```

### Performance Check
- Switching tabs should be instant (< 1 second)
- No flickering or animation lag
- Console should show GET requests for each account

---

## Test 6: Edit Transaction - Override Account

### Steps
1. In Rekening A tab
2. See the "Penjualan" transaction
3. Click **Edit icon** on that row
4. Form dialog opens with existing data
5. **BEFORE EDITING**: Note current Rekening selector shows "Rekening A"
6. **CHANGE**: Rekening selector to "Rekening B"
7. Keep other fields same
8. Click **"Perbarui"** button

### Expected Result
- ✅ Transaction updated successfully
- ✅ Transaction disappears from Rekening A table
- ✅ Switch to Rekening B tab → "Penjualan" transaction now appears there!

### Verify
```javascript
// In MongoDB:
db.cashflows.findOne({category: 'Penjualan'})
// Should show: account: 'Rekening B' (was 'Rekening A')
```

---

## Test 7: Account Field Override in New Entry

### Steps
1. In Rekening A tab
2. Click **"Tambah Transaksi"**
3. Form dialog opens
   - Verify Rekening field = "Rekening A" (auto-filled from tab)
4. **Intentionally change** Rekening to "Rekening B"
5. Fill in:
   - Kategori: **Konsultasi**
   - Jumlah: **2000000**
   - Keep other fields as default
6. Click **"Buat"**

### Expected Result
- ✅ Transaction saved to Rekening B (not Rekening A!)
- ✅ Form override worked
- ✅ When submit, table immediately switches to show empty (since we're still in Tab A)

### Verify
1. Switch to Rekening B tab
2. "Konsultasi" transaction should appear there
3. Go back to Rekening A tab
4. "Konsultasi" NOT there (correctly saved to B)

---

## Test 8: Create Multiple Transactions per Account

### Steps
1. In Rekening A tab
2. Create 3 more transactions:
   - Tx1: income, Penjualan, 500k
   - Tx2: income, Bunga, 100k
   - Tx3: expense, Gaji, 2M
3. Switch to Rekening B tab
4. Create 2 more transactions:
   - Tx4: expense, Operasional, 300k
   - Tx5: income, Komisi, 1M

### Expected Result
```
Rekening A (4 total):
  - Penjualan: +Rp 1,500,000 (1M + 500k)
  - Bunga: +Rp 100,000
  - Gaji: -Rp 2,000,000
  - Total showing in summary

Rekening B (2 total):
  - Operasional: -Rp 300,000
  - Komisi: +Rp 1,000,000
  - Different summary than A
```

### Summary Cards Check
- Each tab should show summary for THAT account only
  - (Note: If summary endpoints don't filter by account, this might not work - see Future Enhancements)

---

## Test 9: Journal Table Display per Account

### Steps
1. Scroll down to see "📖 Buku Journal - Pencatatan Debit/Kredit" section
2. In Rekening A tab: should show all Rekening A transactions
3. Switch to Rekening B tab: journal table should update showing only Rekening B transactions

### Expected Result
```
Journal table filters by selected account
Running balance calculated only for visible transactions
Debit/Credit values correct for each account
```

---

## Test 10: Delete Transaction (Verify Account)

### Steps
1. In Rekening A tab
2. Find a transaction (e.g., Bunga 100k)
3. Click **Delete icon** → Confirm dialog
4. Click **Confirm delete**

### Expected Result
- ✅ Transaction deleted
- ✅ Table updates immediately
- ✅ Deleted transaction gone from Rekening A
- ✅ Verify Rekening B transactions unaffected (switch tab to check)

---

## Test 11: API Verification - Network Inspection

### Steps
1. Open DevTools → Network tab
2. In Rekening A tab, click different tabs and perform actions
3. Inspect each API call:

### Expected Network Calls

#### Tab Switch to Rekening B
```
GET /api/cashflow?account=Rekening%20B
Status: 200
Response body should have: "data": [list of Rekening B transactions]
```

#### Create Transaction in Rekening A
```
POST /api/cashflow
Request body includes:
{
  type: 'income',
  category: 'Penjualan',
  amount: 1000000,
  account: 'Rekening A'
}
Status: 201
```

#### Update Transaction (Change Account)
```
PUT /api/cashflow/{id}
Request body includes:
{
  account: 'Rekening B'
}
Status: 200
```

---

## Test 12: Browser Console Debugging

### Add Debug Logs
```javascript
// In CashflowManagement.js console:
console.log('selectedAccount:', selectedAccount);
console.log('formData.account:', formData.account);
console.log('cashflows:', cashflows);

// When fetching:
console.log('Fetching with account:', selectedAccount);

// When tab changes:
console.log('Tab changed to:', newAccount);
```

### Check for Errors
- Look for red error messages
- Check for network failures
- Verify no undefined values

---

## Regression Tests

### Don't Break Existing Features
- [ ] Profit/Loss Reporting still works
- [ ] Excel Export still includes all accounts
- [ ] Payment Management page still functions
- [ ] Summary cards display correctly
- [ ] CRUD operations (Create, Read, Update, Delete) all work

---

## Edge Cases to Test

### Edge Case 1: Empty Database
```
Delete all cashflow documents
Open CashflowManagement
Should show empty state on both tabs
Create first transaction → appears in selected tab only
```

### Edge Case 2: Rapid Tab Switching
```
Quickly switch between Rekening A and B multiple times
Should not cause errors or data duplication
Each tab shows correct data when settled
```

### Edge Case 3: Same Category in Different Accounts
```
Create "Penjualan" in Rekening A (1M)
Create "Penjualan" in Rekening B (500k)
Switch tabs: each shows their own "Penjualan" with correct amount
```

### Edge Case 4: Concurrent Account Changes
```
Open 2 browser windows, same account
In Window A: Create transaction in Rekening A
In Window B: Still showing old data
Refresh Window B: Should see new transaction
```

---

## Success Metrics

| Metric | Expected | Actual |
|--------|----------|--------|
| Tab switching time | < 500ms | _____ |
| Data isolation | 100% separate | _____ |
| Account field in form | Auto-filled | _____ |
| Account column visible | Yes + color coded | _____ |
| Create transaction | Works both accounts | _____ |
| Edit/Update account | Moves to new account | _____ |
| Table filtering | By selected account | _____ |
| No data mix | 0 transactions shown wrong account | _____ |
| API calls correct | account parameter sent | _____ |
| MongoDB data | account field present | _____ |

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Account tabs not showing | Component not imported | Add `Tabs, Tab` to MUI imports |
| Form account not auto-filled | Rule not set | Check `account: selectedAccount` in formData |
| Table shows all transactions | Backend not filtering | Add `if (account) query.account = account;` |
| Switching tabs shows old data | Cache issue | Clear browser cache |
| Account lost when editing | Update route issue | Add account to PUT route body |
| Type mismatch | Enum not matching | Use exact strings "Rekening A" or "Rekening B" |

---

## Rollback Plan

If critical issues found:
1. Revert CashflowManagement.js to previous version
2. Remove account field from POST/PUT handling
3. Remove account filter from GET route
4. Clear Firestore cache
5. Hard refresh browser (Ctrl+Shift+R)

---

## Sign-Off

- [ ] All tests passed
- [ ] No regressions found
- [ ] Ready for production deployment
- [ ] User training completed
- [ ] Backup taken

**Tested Date**: _____________
**Tester Name**: _____________
**Status**: ✅ READY / ❌ NEEDS FIXES

---

## Notes

_Space for additional observations, issues found, or recommendations:_

