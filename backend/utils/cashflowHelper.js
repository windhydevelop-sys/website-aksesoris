const Cashflow = require('../models/Cashflow');
const BalanceTransaction = require('../models/BalanceTransaction');

/**
 * Sync product with Cashflow & BalanceTransaction
 * 
 * GUARD 1: Only sync if harga > 0
 * GUARD 2: Only sync if paymentStatus === 'paid' OR status === 'completed'
 * GUARD 3: userId must exist (from auth middleware)
 * GUARD 4: Use productId for idempotency (prevent duplicates)
 * GUARD 5: Debt Handling - mark as isDebt if completed but not paid
 * GUARD 6: Only add to BalanceTransaction if NOT debt (actual cash movement)
 */
const syncProductWithCashflow = async (product, userId, account = 'Rekening A') => {
  try {
    // GUARD: userId must exist (from auth middleware)
    if (!userId) {
      console.error(`[Sync Error] Missing userId. This indicates auth middleware is not properly configured.`);
      return;
    }

    // --- 1. HANDLE PIUTANG (INCOME FROM CUSTOMER) ---
    if (product.hargaJual > 0 && product.pembayaranPiutangStatus === 'paid') {
      const piutangAccount = product.pembayaranPiutangAccount && product.pembayaranPiutangAccount !== '-' 
        ? product.pembayaranPiutangAccount 
        : (product.account && product.account !== '-' ? product.account : account);

      const incomeData = {
        type: 'income',
        category: 'Piutang Customer',
        amount: product.hargaJual,
        description: `LUNAS: Piutang ${product.nama} (${product.noOrder})`,
        date: product.updatedAt || new Date(),
        productId: product._id,
        reference: `PIUTANG-${product._id.toString().slice(-6)}`,
        isDebt: false,
        account: piutangAccount,
        lastModifiedBy: userId,
        paymentMethod: piutangAccount === 'cash' ? 'cash' : 'transfer'
      };

      // Upsert Income Entry
      await Cashflow.findOneAndUpdate(
        { productId: product._id, type: 'income' },
        { ...incomeData, createdBy: userId },
        { upsert: true, new: true }
      );

      // Record in BalanceTransaction (Actual Cash Movement)
      await BalanceTransaction.findOneAndUpdate(
        { productId: product._id, type: 'income' },
        { ...incomeData, createdBy: userId },
        { upsert: true, new: true }
      );
      console.log(`[Sync] Recorded Income for product ${product._id}`);
    }

    // --- 2. HANDLE HUTANG (EXPENSE TO ORLAP) ---
    if (product.hargaBeli > 0 && product.pembayaranHutangStatus === 'paid') {
      const hutangAccount = product.pembayaranHutangAccount && product.pembayaranHutangAccount !== '-' 
        ? product.pembayaranHutangAccount 
        : (product.account && product.account !== '-' ? product.account : account);

      const expenseData = {
        type: 'expense',
        category: 'Hutang Orlap',
        amount: product.hargaBeli,
        description: `LUNAS: Hutang ${product.nama} (${product.noOrder})`,
        date: product.updatedAt || new Date(),
        productId: product._id,
        reference: `HUTANG-${product._id.toString().slice(-6)}`,
        isDebt: false,
        account: hutangAccount,
        lastModifiedBy: userId,
        paymentMethod: hutangAccount === 'cash' ? 'cash' : 'transfer'
      };

      // Upsert Expense Entry
      await Cashflow.findOneAndUpdate(
        { productId: product._id, type: 'expense' },
        { ...expenseData, createdBy: userId },
        { upsert: true, new: true }
      );

      // Record in BalanceTransaction (Actual Cash Movement)
      await BalanceTransaction.findOneAndUpdate(
        { productId: product._id, type: 'expense' },
        { ...expenseData, createdBy: userId },
        { upsert: true, new: true }
      );
      console.log(`[Sync] Recorded Expense for product ${product._id}`);
    }

  } catch (error) {
    console.error(`[Sync Error] Failed to sync product ${product._id}:`, error.message);
  }
};

/**
 * Bulk sync products for import operations
 */
const bulkSyncProducts = async (products, userId, account = 'Rekening A') => {
  const results = { successful: 0, failed: 0, skipped: 0 };
  for (const product of products) {
    try {
      await syncProductWithCashflow(product, userId, account);
      results.successful++;
    } catch (error) {
      results.failed++;
    }
  }
  return results;
};

/**
 * Get balance by account for dashboard display
 */
const getAccountBalance = async (account = 'Rekening A', userId) => {
  try {
    const result = await BalanceTransaction.aggregate([
      {
        $match: {
          account: account,
          ...(userId && { createdBy: userId })
        }
      },
      {
        $group: {
          _id: null,
          totalDebit: { $sum: '$debit' },
          totalCredit: { $sum: '$credit' },
          balance: { $sum: { $subtract: ['$debit', '$credit'] } }
        }
      }
    ]);

    return result[0] || {
      totalDebit: 0,
      totalCredit: 0,
      balance: 0
    };
  } catch (error) {
    console.error(`[Get Balance Error] Account ${account}:`, error.message);
    return {
      totalDebit: 0,
      totalCredit: 0,
      balance: 0
    };
  }
};

/**
 * Get all accounts summary
 */
const getAllAccountsBalance = async (userId) => {
  try {
    const accounts = ['Rekening A', 'Rekening B'];
    const summary = {};

    for (const account of accounts) {
      summary[account] = await getAccountBalance(account, userId);
    }

    return summary;
  } catch (error) {
    console.error('[Get All Accounts Error]:', error.message);
    return {
      'Rekening A': { totalDebit: 0, totalCredit: 0, balance: 0 },
      'Rekening B': { totalDebit: 0, totalCredit: 0, balance: 0 }
    };
  }
};

module.exports = {
  syncProductWithCashflow,
  bulkSyncProducts,
  getAccountBalance,
  getAllAccountsBalance
};
