# 🔍 Debugging Flow Pembayaran Produk

## ✅ Flow yang Benar

### **STEP 1: ProductDetail Page (View Data)**
```
1. User buka ProductDetail page
   ├─ Component mount → fetchProduct()
   ├─ GET /api/products/:id
   └─ Display: Harga, Status, Invoice No, Sudah Bayar

2. Data Summary Box (📊 Data Terkini)
   └─ Shows: Harga, Status, Invoice No, Sudah Bayar
```

### **STEP 2: Edit Form (Change Data)**
```
1. User click "Edit Harga & Status" button
   └─ ProductEditForm Dialog opens

2. User change form fields:
   ├─ Harga: 1.000.000 (formatted with dots)
   ├─ Status: completed
   └─ Sudah Bayar: toggle switch

3. User click "Simpan" button
   ├─ Form validation
   ├─ Parse harga: 1.000.000 → 1000000
   └─ Submit form data
```

### **STEP 3: API Update (Send to Backend)**
```
1. ProductEditForm.handleSubmit()
   ├─ Parse harga
   └─ Call onSubmit(submitData)

2. ProductDetail.handleEditSubmit(formData)
   ├─ POST /api/products/:id with { harga, status, sudahBayar }
   └─ await response

3. Backend updates product
   └─ Return: { success: true, data: updatedProduct }
```

### **STEP 4: State Update (Refresh UI)**
```
1. ProductDetail receives response
   ├─ setProduct(response.data.data)
   ├─ setEditDialogOpen(false)
   └─ showSuccess message

2. Component re-render
   ├─ Show updated: Harga, Status, Invoice No
   └─ UI should reflect new values
```

---

## 🐛 Debugging Checklist

### **1. Check Console Logs**
Open browser DevTools (F12) → Console tab

**Expected logs when editing:**
```
📝 Form data before submit: { harga: "1000000", status: "completed", sudahBayar: false }
💾 Parsed harga: 1000000
🚀 Submitting to API with data: { harga: 1000000, status: "completed", sudahBayar: false }
🔵 Starting edit submission with formData: {...}
🟢 Response received: { success: true, data: {...} }
📋 Update state with new product: { noOrder: "xxx", harga: 1000000, status: "completed", sudahBayar: false }
✅ Status changed to COMPLETED - Invoice ready for payment
🔄 Product state updated: { noOrder: "xxx", harga: 1000000, status: "completed", sudahBayar: false }
```

### **2. Verify Data in UI**
- ✅ "📊 Data Terkini" box shows updated harga
- ✅ Status chip shows "COMPLETED" in green
- ✅ Invoice No shows "INV-YYYYMM-XXXXX"

### **3. Check if Data Persists**
- Click "Refresh Data" button
- If data changes, it means state updated but UI didn't re-render properly
- If data reverts, it means API didn't save or didn't return updated value

### **4. Network Tab Check**
Open DevTools → Network tab
- Find PUT request to `/api/products/:id`
- Response should include:
  ```json
  {
    "success": true,
    "data": {
      "_id": "xxx",
      "harga": 1000000,
      "status": "completed",
      "invoiceNo": "202603...",
      "sudahBayar": false
    }
  }
  ```

---

## 🔧 What to Check

### **Issue: Harga not updating**
1. ✅ Check form parsing: `1.000.000` → `1000000`
2. ✅ Verify API receives number, not string
3. ✅ Confirm backend saves to database
4. ✅ Check response returns updated harga

### **Issue: Status not changing to COMPLETED**
1. ✅ Verify status dropdown value is "completed"
2. ✅ Check backend updates status field
3. ✅ Confirm response includes status: "completed"
4. ✅ UI should show green chip with "COMPLETED"

### **Issue: Invoice No not showing**
1. ✅ Backend should auto-generate when status→completed
2. ✅ Response should include invoiceNo field
3. ✅ Display shows: "INV-YYYYMM-XXXXX"

### **Issue: Data doesn't persist after refresh**
1. ✅ Check if backend actually saved to database
2. ✅ Verify PUT endpoint returns updated product
3. ✅ Confirm response.data.data has updated values
4. ✅ setProduct() called with correct data

---

## 📋 Test Scenario

### **Test 1: Edit Harga Only**
```
Before: Harga = 2000000, Status = pending
Action: Change harga to 3000000, keep status = pending
After: 
  ✅ Harga shows 3000000
  ✅ Status still pending
  ✅ No success message about COMPLETED
```

### **Test 2: Change Status to COMPLETED**
```
Before: Status = pending
Action: Change status to completed
After:
  ✅ Status shows "COMPLETED" (green)
  ✅ Success message: "✅ Produk berhasil diperbarui ke status COMPLETED!"
  ✅ Invoice No auto-generated
```

### **Test 3: Full Edit (Harga + Status)**
```
Before: Harga = 2000000, Status = pending
Action: Change harga to 5000000, Status to completed
After:
  ✅ Harga shows 5000000
  ✅ Status shows "COMPLETED"
  ✅ Success message about COMPLETED
  ✅ Invoice No showing
```

---

## 🚨 If Still Not Working

### **Step 1: Enable All Logs**
```javascript
// Add to browser console
localStorage.setItem('DEBUG', 'true');
// Then refresh page
```

### **Step 2: Check Backend Logs**
- SSH to backend server
- Check application logs for PUT /api/products/:id requests
- Verify backend is actually updating database

### **Step 3: Test API Directly**
Use Postman or curl:
```bash
curl -X PUT http://localhost:5000/api/products/PRODUCT_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"harga": 5000000, "status": "completed", "sudahBayar": false}'
```

### **Step 4: Check Database**
- Verify product document in MongoDB updated
- Check fields: harga, status, invoiceNo, updatedAt

---

## 📊 Expected Flow Summary

```
User Edit Form
    ↓
 Validate & Parse Data
    ↓
  Send PUT Request
    ↓
 Backend Updates DB
    ↓
 Return Updated Product
    ↓
  Update State (setProduct)
    ↓
 Component Re-render
    ↓
 UI Shows New Data ✅
```
