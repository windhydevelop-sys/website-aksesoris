# Phase 4: Quick Start Testing Guide

**Objective:** Test product payment flow end-to-end (15-30 minutes)

---

## 1️⃣ Setup (2 minutes)

### Terminal 1: Backend
```bash
cd /Users/macbook/projects/website_aksesoris
npm run dev
# Wait for "✅ Server running on port 5000"
```

### Terminal 2: Frontend  
```bash
cd /Users/macbook/projects/website_aksesoris/frontend
npm start
# Browser opens to http://localhost:3000
```

### Terminal 3: MongoDB Check (Optional)
```bash
mongosh
use website_aksesoris
show collections
```

---

## 2️⃣ Quick Manual Test (10-15 minutes)

### Step 1: Login
- URL: `http://localhost:3000`
- Username: [admin credentials]
- Password: [password]
- Click Login

### Step 2: Navigate to Dashboard Produk
- Sidebar → "Dashboard Produk"
- Or direct URL: `http://localhost:3000/products`
- ✅ Should see table with products

### Step 3: Edit a Product
- Click Edit button (✏️) on first product
- Change "Harga" to any value (e.g., 2500000)
- Click "Simpan" (Save)
- ✅ Should see "Produk berhasil diperbarui"
- ✅ Table refreshes with new value

### Step 4: Record Payment (THE KEY TEST ⭐)
- Find a product with "⏳ Belum" status
- Click Payment button (💳)
- Select a Rekening from dropdown
- Click "Terima Pembayaran"
- ✅ Should see "Pembayaran berhasil dicatat"
- ✅ Dialog closes
- ✅ Table now shows "✅ Lunas" for this product

### Step 5: Verify Cashflow Updated
- Sidebar → "Cashflow"
- Select same Rekening used for payment
- Look at "Total Expense" card
- ✅ Should show payment amount
- ✅ "Net Profit" should recalculate

### Step 6: Check Database
```bash
# In another terminal, use mongosh:
mongosh
use website_aksesoris

# Check ProductPayment created:
db.productpayments.findOne({}, {sort: {createdAt: -1}})
# ✅ Should show recent payment with cashflowId

# Check Cashflow created:
db.cashflows.findOne({}, {sort: {createdAt: -1}})
# ✅ Should show expense entry

# Check Product updated:
db.products.findOne({sudahBayar: true})
# ✅ Should show sudahBayar: true and paymentDate set
```

---

## 3️⃣ Run Automated Tests (5 minutes)

### Get JWT Token
First, login and copy token from browser:
1. Open DevTools (F12)
2. Click Application tab
3. LocalStorage → find token value
4. Copy it

### Run Test Script
```bash
# Terminal 4: From workspace root
LAMP_TOKEN="paste_your_token_here" node backend/test-product-payment-flow.js

# Or with token as argument:
node backend/test-product-payment-flow.js "paste_your_token_here"
```

### Expected Output
```
✅ Passed: 18
❌ Failed: 0
📊 Total: 18
📈 Pass Rate: 100%
🎉 All tests passed!
```

---

## 4️⃣ Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Dashboard blank | Restart backend: `npm run dev` |
| Payment button disabled | Product already paid (filter for "Belum") |
| "Gagal memuat" error | Backend not running or token invalid |
| UI doesn't update | Hard refresh (Cmd+Shift+R) |
| Harga shows NaN | Clear browser cache or restart frontend |
| Test fails with 401 | Token expired, login again |
| Cashflow cards unchanged | Wrong Rekening selected, change dropdown |

---

## 5️⃣ Success Checklist

- [ ] Dashboard loads with products
- [ ] Can edit product harga
- [ ] Can record payment for unpaid product
- [ ] Payment notification appears
- [ ] Product status changes to "✅ Lunas"
- [ ] Cashflow cards update with expense
- [ ] Database shows ProductPayment + Cashflow entries
- [ ] Automated tests pass 18/18

✅ **If all checked: Phase 4 COMPLETE**

---

## 6️⃣ Common Test Scenarios

### Scenario A: Full Happy Path (5 min)
1. Edit product (change harga)
2. Record payment (select rekening)
3. Verify Cashflow updated
4. Check database entries
✅ Expected: All succeed

### Scenario B: Payment Status Flow (3 min)
1. Record payment for product
2. Check UI shows "✅ Lunas"
3. Try to pay again → Error "sudah dibayar"
✅ Expected: Status prevents duplicate

### Scenario C: Multiple Accounts (5 min)
1. Record payment on Rekening A
2. Switch to Rekening B → Cashflow shows 0 expense
3. Switch back to Rekening A → Expense reappears
✅ Expected: Account filtering works

### Scenario D: Error Recovery (3 min)
1. Stop backend
2. Try to load Dashboard → Error appears
3. Restart backend
4. Reload → Works again
✅ Expected: No crashes, graceful recovery

---

## 7️⃣ Next Steps

### If All Tests Pass ✅
→ Proceed to **Phase 5: Refinement & Optimization**
- Add invoice generation UI
- Add payment confirmation workflow
- Add receipt/report generation

### If Any Test Fails ❌
→ Check PHASE4-TESTING-GUIDE.md for detailed debugging
- Identify which component failed
- Check console errors or API response
- Review backend logs
- Fix and retest

---

## 📋 Quick Command Reference

```bash
# Start all services
Terminal 1: npm run dev                    # Backend
Terminal 2: npm start (from frontend/)    # Frontend
Terminal 3: mongosh                       # DB access

# Run tests
LAMP_TOKEN="xxx" node backend/test-product-payment-flow.js

# Check API directly
curl http://localhost:5000/api/products

# View logs
tail -f backend/logs/error.log

# Kill processes
Cmd+C in each terminal

# Clear data (if needed)
# mongosh → db.products.deleteMany({})
```

---

## ⏱️ Time Budget

| Activity | Time | Status |
|----------|------|--------|
| Setup & Start Servers | 2 min | ⏳ |
| Manual Testing (5 steps) | 10-15 min | ⏳ |
| Automated Testing | 2-3 min | ⏳ |
| Database Verification | 2-3 min | ⏳ |
| Debugging (if needed) | 5-10 min | ⏳ |
| **Total** | **20-35 min** | ⏳ |

---

## 🎯 Critical Validation Points

These are the MUST-PASS tests:

1. **Payment Recording** ⭐⭐⭐
   - Record payment → ProductPayment + Cashflow created
   - Verify both database entries exist

2. **Data Integrity** ⭐⭐⭐
   - Amount matches between Product, Payment, Cashflow
   - Rekening consistent across all records
   - Timestamps present and valid

3. **UI Consistency** ⭐⭐
   - Product status changes to paid
   - Cashflow cards update
   - No stale data in UI

4. **No Errors** ⭐⭐
   - No console errors
   - No backend 500 errors
   - Graceful error handling

---

## 📞 Need Help?

1. Check browser console (F12 → Console tab)
2. Check backend logs (watch terminal 1)
3. Run automated tests: `node backend/test-product-payment-flow.js`
4. Review detailed guide: `PHASE4-INTEGRATION-TEST-RESULTS.md`
5. Check debugging tips: `frontend/src/utils/Phase4TestingGuide.js`

---

**Ready? Start with Step 1 above! 🚀**

