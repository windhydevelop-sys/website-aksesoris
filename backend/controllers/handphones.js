const Handphone = require('../models/Handphone');
const { auditLog, securityLog } = require('../utils/audit');

// Get all handphones
const getHandphones = async (req, res) => {
  try {
    const handphones = await Handphone.find()
      .populate('assignedTo', 'kodeOrlap namaOrlap')
      .populate('currentProduct', 'noOrder nama')
      .sort({ createdAt: -1 });

    auditLog('READ', req.userId, 'Handphone', 'all', {
      count: handphones.length
    }, req);

    res.json({
      success: true,
      data: handphones,
      count: handphones.length
    });
  } catch (error) {
    securityLog('HANDPHONE_READ_FAILED', 'low', {
      error: error.message,
      userId: req.userId
    }, req);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch handphones'
    });
  }
};

// Get handphone by ID
const getHandphoneById = async (req, res) => {
  try {
    const handphone = await Handphone.findById(req.params.id)
      .populate('assignedTo', 'kodeOrlap namaOrlap')
      .populate('currentProduct', 'noOrder nama');

    if (!handphone) {
      return res.status(404).json({
        success: false,
        error: 'Handphone not found'
      });
    }

    auditLog('READ', req.userId, 'Handphone', req.params.id, {
      imei: handphone.imei
    }, req);

    res.json({
      success: true,
      data: handphone
    });
  } catch (error) {
    securityLog('HANDPHONE_READ_FAILED', 'low', {
      error: error.message,
      handphoneId: req.params.id,
      userId: req.userId
    }, req);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch handphone'
    });
  }
};

// Create new handphone
const createHandphone = async (req, res) => {
  try {
    const { merek, tipe, imei, spesifikasi, kepemilikan, assignedTo, status } = req.body;

    // Validate required fields
    if (!merek || !tipe || !imei) {
      return res.status(400).json({
        success: false,
        error: 'Merek, tipe, dan IMEI wajib diisi'
      });
    }

    // Check for duplicate IMEI
    const existingHandphone = await Handphone.findOne({ imei });
    if (existingHandphone) {
      return res.status(400).json({
        success: false,
        error: 'IMEI sudah terdaftar'
      });
    }

    const handphoneData = {
      merek: merek.trim(),
      tipe: tipe.trim(),
      imei: imei.trim(),
      spesifikasi: spesifikasi?.trim(),
      kepemilikan: kepemilikan || 'Perusahaan',
      assignedTo: assignedTo || null,
      status: status || 'available',
      createdBy: req.userId,
      lastModifiedBy: req.userId
    };

    const handphone = new Handphone(handphoneData);
    await handphone.save();

    auditLog('CREATE', req.userId, 'Handphone', handphone._id, {
      merek: handphone.merek,
      tipe: handphone.tipe,
      imei: handphone.imei
    }, req);

    res.status(201).json({
      success: true,
      data: handphone,
      message: 'Handphone berhasil ditambahkan'
    });
  } catch (error) {
    securityLog('HANDPHONE_CREATE_FAILED', 'medium', {
      error: error.message,
      userId: req.userId
    }, req);

    res.status(500).json({
      success: false,
      error: 'Failed to create handphone'
    });
  }
};

// Update handphone
const updateHandphone = async (req, res) => {
  try {
    const { merek, tipe, imei, spesifikasi, kepemilikan, assignedTo, status } = req.body;

    const updateData = {
      lastModifiedBy: req.userId
    };

    if (merek !== undefined) updateData.merek = merek.trim();
    if (tipe !== undefined) updateData.tipe = tipe.trim();
    if (imei !== undefined) {
      // Check for duplicate IMEI (excluding current handphone)
      const existingHandphone = await Handphone.findOne({
        imei: imei.trim(),
        _id: { $ne: req.params.id }
      });
      if (existingHandphone) {
        return res.status(400).json({
          success: false,
          error: 'IMEI sudah digunakan handphone lain'
        });
      }
      updateData.imei = imei.trim();
    }
    if (spesifikasi !== undefined) updateData.spesifikasi = spesifikasi?.trim();
    if (kepemilikan !== undefined) updateData.kepemilikan = kepemilikan;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (status !== undefined) updateData.status = status;

    const handphone = await Handphone.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'kodeOrlap namaOrlap')
     .populate('currentProduct', 'noOrder nama');

    if (!handphone) {
      return res.status(404).json({
        success: false,
        error: 'Handphone not found'
      });
    }

    auditLog('UPDATE', req.userId, 'Handphone', req.params.id, {
      merek: handphone.merek,
      status: handphone.status
    }, req);

    res.json({
      success: true,
      data: handphone,
      message: 'Handphone berhasil diperbarui'
    });
  } catch (error) {
    securityLog('HANDPHONE_UPDATE_FAILED', 'medium', {
      error: error.message,
      handphoneId: req.params.id,
      userId: req.userId
    }, req);

    res.status(500).json({
      success: false,
      error: 'Failed to update handphone'
    });
  }
};

// Delete handphone
const deleteHandphone = async (req, res) => {
  try {
    const handphone = await Handphone.findById(req.params.id);

    if (!handphone) {
      return res.status(404).json({
        success: false,
        error: 'Handphone not found'
      });
    }

    // Check if handphone is currently assigned
    if (handphone.status === 'in_use') {
      return res.status(400).json({
        success: false,
        error: 'Tidak dapat menghapus handphone yang sedang digunakan'
      });
    }

    await Handphone.findByIdAndDelete(req.params.id);

    auditLog('DELETE', req.userId, 'Handphone', req.params.id, {
      merek: handphone.merek,
      imei: handphone.imei
    }, req);

    res.json({
      success: true,
      message: 'Handphone berhasil dihapus'
    });
  } catch (error) {
    securityLog('HANDPHONE_DELETE_FAILED', 'high', {
      error: error.message,
      handphoneId: req.params.id,
      userId: req.userId
    }, req);

    res.status(500).json({
      success: false,
      error: 'Failed to delete handphone'
    });
  }
};

module.exports = {
  getHandphones,
  getHandphoneById,
  createHandphone,
  updateHandphone,
  deleteHandphone
};