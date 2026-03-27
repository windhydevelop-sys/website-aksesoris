const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const RekeningDetail = require('../models/RekeningDetail');
const auth = require('../middleware/auth');

// ============================================================
// GET - Fetch rekening detail
// ============================================================

// Get all rekening details for current user
router.get('/', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    console.log('🔍 [GET /] Fetching all rekening details for user:', req.user.id);
    
    const details = await RekeningDetail.find({ userId: userId })
      .populate('createdBy', 'username')
      .populate('lastModifiedBy', 'username')
      .sort({ account: 1 });

    console.log('   Found', details.length, 'rekening(s):', details.map(d => ({ account: d.account, saldoAwal: d.saldoAwal })));

    res.json({
      success: true,
      data: details,
      count: details.length
    });
  } catch (error) {
    console.error('Error fetching rekening details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rekening details'
    });
  }
});

// Get rekening detail by account (Rekening A or B)
router.get('/account/:account', auth, async (req, res) => {
  try {
    const { account } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    console.log('🔍 [GET /account/:account]');
    console.log('   Requested account:', account);
    console.log('   User ID:', req.user.id);
    console.log('   User ID (ObjectId):', userId);
    
    if (!['Rekening A', 'Rekening B'].includes(account)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account. Must be "Rekening A" or "Rekening B"'
      });
    }

    const detail = await RekeningDetail.findOne({
      userId: userId,
      account: account
    })
      .populate('createdBy', 'username')
      .populate('lastModifiedBy', 'username');

    console.log('   Query result:', detail ? '✅ Found' : '❌ Not found');
    
    if (!detail) {
      console.log('   Available accounts for this user:', await RekeningDetail.find({ userId: userId }).select('account'));
      return res.status(404).json({
        success: false,
        error: `Rekening detail not found for ${account}`,
        detail: null
      });
    }

    res.json({
      success: true,
      data: detail
    });
  } catch (error) {
    console.error('Error fetching rekening detail:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rekening detail'
    });
  }
});

// ============================================================
// POST - Create rekening detail
// ============================================================

router.post('/', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    console.log('📝 [POST /] Creating rekening detail');
    console.log('   User ID:', req.user.id);
    console.log('   User ID (ObjectId):', userId);
    
    const {
      account, namaBank, nomorRekening, namaPemilik, cabang,
      saldoAwal, keterangan, status, tipeRekening, mata_uang
    } = req.body;

    console.log('   Account:', account);

    // Validation
    if (!account || !namaBank || !nomorRekening || !namaPemilik) {
      return res.status(400).json({
        success: false,
        error: 'Rekening, Nama Bank, Nomor Rekening, dan Nama Pemilik wajib diisi'
      });
    }

    if (!['Rekening A', 'Rekening B'].includes(account)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account. Must be "Rekening A" or "Rekening B"'
      });
    }

    // Check if already exists
    const existing = await RekeningDetail.findOne({
      userId: userId,
      account: account
    });

    if (existing) {
      console.log('   ❌ Account already exists');
      return res.status(409).json({
        success: false,
        error: `Detail ${account} sudah ada. Gunakan PUT untuk update.`
      });
    }

    // Check for duplicate nomor rekening
    const duplicateNomor = await RekeningDetail.findOne({
      nomorRekening: nomorRekening,
      userId: userId,
      account: { $ne: account }
    });

    if (duplicateNomor) {
      return res.status(400).json({
        success: false,
        error: 'Nomor rekening sudah terdaftar'
      });
    }

    // Create new record
    const newDetail = new RekeningDetail({
      userId: userId,
      account,
      namaBank,
      nomorRekening,
      namaPemilik,
      cabang,
      saldoAwal: saldoAwal || 0,
      saldoTerkini: saldoAwal || 0,
      keterangan,
      status: status || 'aktif',
      tipeRekening: tipeRekening || 'tabungan',
      mata_uang: mata_uang || 'IDR',
      createdBy: userId,
      lastModifiedBy: userId
    });

    const saved = await newDetail.save();
    console.log('   ✅ Created:', { account: saved.account, userId: saved.userId, saldoAwal: saved.saldoAwal });
    const populated = await saved.populate('createdBy', 'username');

    res.status(201).json({
      success: true,
      data: populated,
      message: `Detail ${account} berhasil dibuat`
    });
  } catch (error) {
    console.error('Error creating rekening detail:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Nomor rekening sudah terdaftar'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create rekening detail'
    });
  }
});

// ============================================================
// PUT - Update rekening detail
// ============================================================

router.put('/account/:account', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { account } = req.params;
    const {
      namaBank, nomorRekening, namaPemilik, cabang,
      saldoAwal, saldoTerkini, keterangan, status, tipeRekening, mata_uang
    } = req.body;

    if (!['Rekening A', 'Rekening B'].includes(account)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account'
      });
    }

    // Build update data
    const updateData = {
      lastModifiedBy: userId,
      lastModifiedAt: Date.now()
    };

    if (namaBank) updateData.namaBank = namaBank;
    if (nomorRekening) updateData.nomorRekening = nomorRekening;
    if (namaPemilik) updateData.namaPemilik = namaPemilik;
    if (cabang) updateData.cabang = cabang;
    if (saldoAwal !== undefined) updateData.saldoAwal = saldoAwal;
    if (saldoTerkini !== undefined) {
      updateData.saldoTerkini = saldoTerkini;
      updateData.tanggalSaldoTerkini = Date.now();
    }
    if (keterangan !== undefined) updateData.keterangan = keterangan || '';
    if (status) updateData.status = status;
    if (tipeRekening) updateData.tipeRekening = tipeRekening;
    if (mata_uang) updateData.mata_uang = mata_uang;

    // Find and update
    const detail = await RekeningDetail.findOneAndUpdate(
      { userId: userId, account: account },
      updateData,
      { new: true, runValidators: true }
    ).populate('lastModifiedBy', 'username');

    if (!detail) {
      return res.status(404).json({
        success: false,
        error: `Detail ${account} tidak ditemukan`
      });
    }

    res.json({
      success: true,
      data: detail,
      message: `Detail ${account} berhasil diupdate`
    });
  } catch (error) {
    console.error('Error updating rekening detail:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Nomor rekening sudah terdaftar'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update rekening detail'
    });
  }
});

// ============================================================
// DELETE - Delete rekening detail
// ============================================================

router.delete('/account/:account', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { account } = req.params;

    if (!['Rekening A', 'Rekening B'].includes(account)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account'
      });
    }

    const detail = await RekeningDetail.findOneAndDelete({
      userId: userId,
      account: account
    });

    if (!detail) {
      return res.status(404).json({
        success: false,
        error: `Detail ${account} tidak ditemukan`
      });
    }

    res.json({
      success: true,
      data: detail,
      message: `Detail ${account} berhasil dihapus`
    });
  } catch (error) {
    console.error('Error deleting rekening detail:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete rekening detail'
    });
  }
});

// ============================================================
// PATCH - Update only saldo (auto-sync from cashflow)
// ============================================================

router.patch('/saldo/:account', auth, async (req, res) => {
  try {
    const { account } = req.params;
    const { saldoTerkini } = req.body;

    if (saldoTerkini === undefined) {
      return res.status(400).json({
        success: false,
        error: 'saldoTerkini is required'
      });
    }

    const detail = await RekeningDetail.findOneAndUpdate(
      { userId: req.user.id, account: account },
      {
        saldoTerkini: saldoTerkini,
        tanggalSaldoTerkini: Date.now()
      },
      { new: true }
    );

    if (!detail) {
      return res.status(404).json({
        success: false,
        error: `Detail ${account} tidak ditemukan`
      });
    }

    res.json({
      success: true,
      data: detail,
      message: 'Saldo updated'
    });
  } catch (error) {
    console.error('Error updating saldo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update saldo'
    });
  }
});

module.exports = router;
