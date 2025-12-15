const Joi = require('joi');

// Product validation schema for CREATE (all required fields)
const productSchema = Joi.object({
  noOrder: Joi.string().trim().optional().messages({
    'string.empty': 'No. Order tidak boleh kosong'
  }),

  codeAgen: Joi.string().trim().optional().label('Kode Orlap').messages({
    'string.empty': 'Kode Orlap tidak boleh kosong'
  }),

  customer: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Customer tidak boleh kosong',
    'any.required': 'Customer wajib diisi'
  }),

  bank: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Bank tidak boleh kosong',
    'any.required': 'Bank wajib diisi'
  }),

  grade: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Grade tidak boleh kosong',
    'any.required': 'Grade wajib diisi'
  }),

  kcp: Joi.string().trim().min(1).required().messages({
    'string.empty': 'KCP tidak boleh kosong',
    'any.required': 'KCP wajib diisi'
  }),

  nik: Joi.string().pattern(/^\d{16}$/).required().messages({
    'string.pattern.base': 'NIK harus 16 digit angka (contoh: 3201010101010001)',
    'any.required': 'NIK wajib diisi'
  }),

  nama: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Nama tidak boleh kosong',
    'any.required': 'Nama wajib diisi'
  }),

  namaIbuKandung: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Nama Ibu Kandung tidak boleh kosong',
    'any.required': 'Nama Ibu Kandung wajib diisi'
  }),

  tempatTanggalLahir: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Tempat/Tanggal Lahir tidak boleh kosong',
    'any.required': 'Tempat/Tanggal Lahir wajib diisi'
  }),

  noRek: Joi.string().pattern(/^\d{10,18}$/).required().messages({
    'string.pattern.base': 'No. Rekening harus 10-18 digit angka',
    'any.required': 'No. Rekening wajib diisi'
  }),

  sisaSaldo: Joi.string().optional().messages({
    'string.base': 'Sisa Saldo harus berupa string'
  }),

  noAtm: Joi.string().pattern(/^\d{16}$/).required().messages({
    'string.pattern.base': 'No. ATM harus 16 digit angka',
    'any.required': 'No. ATM wajib diisi'
  }),

  validThru: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Valid Thru tidak boleh kosong',
    'any.required': 'Valid Thru wajib diisi'
  }),

  noHp: Joi.string().pattern(/^(\+62|62|0)8[1-9][0-9]{6,9}$/).required().messages({
    'string.pattern.base': 'Format nomor HP tidak valid (contoh: 081234567890)',
    'any.required': 'No. HP wajib diisi'
  }),

  handphone: Joi.string().trim().allow('').optional().messages({
    'string.base': 'Handphone harus berupa string'
  }),

  handphoneId: Joi.string().optional().messages({
    'string.base': 'Handphone ID harus berupa string'
  }),

  imeiHandphone: Joi.string().trim().allow('').optional().messages({
    'string.base': 'IMEI Handphone harus berupa string'
  }),

  pinAtm: Joi.string().pattern(/^\d{4,6}$/).required().messages({
    'string.pattern.base': 'PIN ATM harus 4-6 digit angka',
    'any.required': 'PIN ATM wajib diisi'
  }),

  pinWondr: Joi.string().pattern(/^\d{4,6}$/).required().messages({
    'string.pattern.base': 'PIN Wondr harus 4-6 digit angka',
    'any.required': 'PIN Wondr wajib diisi'
  }),

  passWondr: Joi.string().min(6).required().messages({
    'string.min': 'Password Wondr minimal 6 karakter',
    'any.required': 'Password Wondr wajib diisi'
  }),

  email: Joi.string().email().required().messages({
    'string.email': 'Format email tidak valid (contoh: user@example.com)',
    'any.required': 'Email wajib diisi'
  }),

  passEmail: Joi.string().min(6).required().messages({
    'string.min': 'Password Email minimal 6 karakter',
    'any.required': 'Password Email wajib diisi'
  }),

  expired: Joi.date().required().messages({
    'date.base': 'Format tanggal expired tidak valid (gunakan format YYYY-MM-DD)',
    'any.required': 'Expired date wajib diisi'
  }),

  uploadFotoId: Joi.string().optional().messages({
    'string.base': 'Foto KTP harus berupa string'
  }),

  uploadFotoSelfie: Joi.string().optional().messages({
    'string.base': 'Foto Selfie harus berupa string'
  }),

  status: Joi.string().valid('pending', 'in_progress', 'completed').optional().messages({
    'any.only': 'Status produk tidak valid',
    'string.base': 'Status produk harus berupa string'
  }),
  complaint: Joi.string().optional().messages({
    'string.base': 'Complaint harus berupa string'
  })
});

// Product validation schema for UPDATE (all fields optional)
const productUpdateSchema = Joi.object({
  noOrder: Joi.string().trim().optional().messages({
    'string.empty': 'No. Order tidak boleh kosong'
  }),

  codeAgen: Joi.string().trim().optional().label('Kode Orlap').messages({
    'string.empty': 'Kode Orlap tidak boleh kosong'
  }),

  customer: Joi.string().trim().min(1).optional().messages({
    'string.empty': 'Customer tidak boleh kosong'
  }),

  bank: Joi.string().trim().min(1).optional().messages({
    'string.empty': 'Bank tidak boleh kosong'
  }),

  grade: Joi.string().trim().min(1).optional().messages({
    'string.empty': 'Grade tidak boleh kosong'
  }),

  kcp: Joi.string().trim().min(1).optional().messages({
    'string.empty': 'KCP tidak boleh kosong'
  }),

  nik: Joi.string().pattern(/^\d{16}$/).optional().messages({
    'string.pattern.base': 'NIK harus 16 digit angka (contoh: 3201010101010001)'
  }),

  nama: Joi.string().trim().min(1).optional().messages({
    'string.empty': 'Nama tidak boleh kosong'
  }),

  namaIbuKandung: Joi.string().trim().min(1).optional().messages({
    'string.empty': 'Nama Ibu Kandung tidak boleh kosong'
  }),

  tempatTanggalLahir: Joi.string().trim().min(1).optional().messages({
    'string.empty': 'Tempat/Tanggal Lahir tidak boleh kosong'
  }),

  noRek: Joi.string().pattern(/^\d{10,18}$/).optional().messages({
    'string.pattern.base': 'No. Rekening harus 10-18 digit angka'
  }),

  sisaSaldo: Joi.string().optional().messages({
    'string.base': 'Sisa Saldo harus berupa string'
  }),

  noAtm: Joi.string().pattern(/^\d{16}$/).optional().messages({
    'string.pattern.base': 'No. ATM harus 16 digit angka'
  }),

  validThru: Joi.string().trim().min(1).optional().messages({
    'string.empty': 'Valid Thru tidak boleh kosong'
  }),

  noHp: Joi.string().pattern(/^(\+62|62|0)8[1-9][0-9]{6,9}$/).optional().messages({
    'string.pattern.base': 'Format nomor HP tidak valid (contoh: 081234567890)'
  }),

  handphone: Joi.string().trim().allow('').optional().messages({
    'string.base': 'Handphone harus berupa string'
  }),

  handphoneId: Joi.string().optional().messages({
    'string.base': 'Handphone ID harus berupa string'
  }),

  imeiHandphone: Joi.string().trim().allow('').optional().messages({
    'string.base': 'IMEI Handphone harus berupa string'
  }),

  pinAtm: Joi.string().pattern(/^\d{4,6}$/).optional().messages({
    'string.pattern.base': 'PIN ATM harus 4-6 digit angka'
  }),

  pinWondr: Joi.string().pattern(/^\d{4,6}$/).optional().messages({
    'string.pattern.base': 'PIN Wondr harus 4-6 digit angka'
  }),

  passWondr: Joi.string().min(6).optional().messages({
    'string.min': 'Password Wondr minimal 6 karakter'
  }),

  email: Joi.string().email().optional().messages({
    'string.email': 'Format email tidak valid (contoh: user@example.com)'
  }),

  passEmail: Joi.string().min(6).optional().messages({
    'string.min': 'Password Email minimal 6 karakter'
  }),

  expired: Joi.date().optional().messages({
    'date.base': 'Format tanggal expired tidak valid (gunakan format YYYY-MM-DD)'
  }),

  uploadFotoId: Joi.string().optional().messages({
    'string.base': 'Foto KTP harus berupa string'
  }),

  uploadFotoSelfie: Joi.string().optional().messages({
    'string.base': 'Foto Selfie harus berupa string'
  }),

  status: Joi.string().valid('pending', 'in_progress', 'completed').optional().messages({
    'any.only': 'Status produk tidak valid',
    'string.base': 'Status produk harus berupa string'
  }),
  complaint: Joi.string().optional().messages({
    'string.base': 'Complaint harus berupa string'
  })
});

// User validation schema
const userSchema = Joi.object({
  username: Joi.string().min(3).max(50).required().messages({
    'string.min': 'Username minimal 3 karakter',
    'string.max': 'Username maksimal 50 karakter',
    'any.required': 'Username wajib diisi'
  }),

  email: Joi.string().email().required().messages({
    'string.email': 'Format email tidak valid',
    'any.required': 'Email wajib diisi'
  }),

  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
    'string.min': 'Password minimal 8 karakter',
    'string.pattern.base': 'Password harus mengandung huruf besar, huruf kecil, angka, dan simbol',
    'any.required': 'Password wajib diisi'
  })
});

// Validation middleware for CREATE
const validateProduct = (req, res, next) => {
  console.log('CREATE - Request body before Joi validation:', req.body);

  // Fix array values from frontend autocomplete BEFORE Joi validation
  if (Array.isArray(req.body.noOrder)) {
    console.log('Converting noOrder array in validation middleware:', req.body.noOrder, '->', req.body.noOrder[0] || '');
    req.body.noOrder = req.body.noOrder[0] || '';
  }
  if (Array.isArray(req.body.codeAgen)) {
    console.log('Converting codeAgen array in validation middleware:', req.body.codeAgen, '->', req.body.codeAgen[0] || '');
    req.body.codeAgen = req.body.codeAgen[0] || '';
  }

  console.log('CREATE - Request body after array conversion:', req.body);

  const { error, value } = productSchema.validate(req.body, { abortEarly: false, stripUnknown: true });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      msg: 'Validation error',
      errors
    });
  }
  req.body = value; // Update req.body with the validated and stripped value
  next();
};

// Validation middleware for UPDATE (all fields optional)
const validateProductUpdate = (req, res, next) => {
  console.log('UPDATE - Request body before Joi validation:', req.body);

  // Fix array values from frontend autocomplete BEFORE Joi validation
  if (Array.isArray(req.body.noOrder)) {
    console.log('Converting noOrder array in validation middleware:', req.body.noOrder, '->', req.body.noOrder[0] || '');
    req.body.noOrder = req.body.noOrder[0] || '';
  }
  if (Array.isArray(req.body.codeAgen)) {
    console.log('Converting codeAgen array in validation middleware:', req.body.codeAgen, '->', req.body.codeAgen[0] || '');
    req.body.codeAgen = req.body.codeAgen[0] || '';
  }

  console.log('UPDATE - Request body after array conversion:', req.body);

  const { error, value } = productUpdateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      msg: 'Validation error',
      errors
    });
  }
  req.body = value; // Update req.body with the validated and stripped value
  next();
};

const validateUser = (req, res, next) => {
  const { error } = userSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      msg: 'Validation error',
      errors
    });
  }

  next();
};

module.exports = {
  validateProduct,
  validateProductUpdate,
  validateUser,
  productSchema,
  productUpdateSchema,
  userSchema
};