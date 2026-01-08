import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import './Dashboard.css';

function TelegramProductForm() {
  const [tgUser, setTgUser] = useState(null);
  const [bank, setBank] = useState('');
  const [form, setForm] = useState({
    customer: '',
    bank: '',
    grade: '',
    kcp: '',
    nik: '',
    nama: '',
    namaIbuKandung: '',
    tempatTanggalLahir: '',
    noRek: '',
    noAtm: '',
    validThru: '',
    noHp: '',
    pinAtm: '',
    pinWondr: '',
    passWondr: '',
    email: '',
    passEmail: '',
    expired: '',
    myBCAUser: '',
    myBCAPassword: '',
    brimoUser: '',
    brimoPassword: '',
    briMerchantUser: '',
    briMerchantPassword: ''
  });
  const [fotoKTP, setFotoKTP] = useState(null);
  const [fotoSelfie, setFotoSelfie] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
    if (tg) {
      tg.ready();
      const data = tg.initDataUnsafe || {};
      setTgUser(data?.user || null);
    }
  }, []);

  const handleSubmit = async () => {
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (fotoKTP) fd.append('uploadFotoId', fotoKTP);
      if (fotoSelfie) fd.append('uploadFotoSelfie', fotoSelfie);

      const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
      const tgUserId = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : null;

      const res = await axios.post('/api/telegram/products', fd, {
        headers: {
          ...(tgUserId ? { 'X-Telegram-User-Id': String(tgUserId) } : {}),
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data?.success) {
        setStatusMsg('Produk berhasil dibuat.');
      } else {
        setStatusMsg(res.data?.error || 'Gagal membuat produk.');
      }
    } catch (e) {
      setStatusMsg('Terjadi kesalahan saat mengirim data.');
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Form Input Produk (Telegram Web App)</h2>
      <p>Isi data dasar, kolom tambahan akan muncul sesuai bank.</p>
      {tgUser ? (
        <div>
          <p>Terhubung sebagai: {tgUser.username || tgUser.first_name}</p>
        </div>
      ) : (
        <p>Telegram Web App belum terdeteksi. Jika Anda membuka ini dari browser biasa, beberapa fitur tidak tersedia.</p>
      )}
      <div className="card">
        <div style={{ display: 'grid', gap: 12 }}>
          <input placeholder="Customer" value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} />
          <select value={form.bank} onChange={e => { setForm({ ...form, bank: e.target.value }); setBank(e.target.value) }}>
            <option value="">Pilih Bank</option>
            <option value="BCA">BCA</option>
            <option value="BRI">BRI</option>
          </select>
          <input placeholder="Grade" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} />
          <input placeholder="KCP" value={form.kcp} onChange={e => setForm({ ...form, kcp: e.target.value })} />
          <input placeholder="NIK" value={form.nik} onChange={e => setForm({ ...form, nik: e.target.value })} />
          <input placeholder="Nama" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} />
          <input placeholder="Nama Ibu Kandung" value={form.namaIbuKandung} onChange={e => setForm({ ...form, namaIbuKandung: e.target.value })} />
          <input placeholder="Tempat/Tanggal Lahir" value={form.tempatTanggalLahir} onChange={e => setForm({ ...form, tempatTanggalLahir: e.target.value })} />
          <input placeholder="No. Rekening" value={form.noRek} onChange={e => setForm({ ...form, noRek: e.target.value })} />
          <input placeholder="No. ATM" value={form.noAtm} onChange={e => setForm({ ...form, noAtm: e.target.value })} />
          <input placeholder="Valid Thru" value={form.validThru} onChange={e => setForm({ ...form, validThru: e.target.value })} />
          <input placeholder="No. HP" value={form.noHp} onChange={e => setForm({ ...form, noHp: e.target.value })} />
          <input placeholder="PIN ATM" value={form.pinAtm} onChange={e => setForm({ ...form, pinAtm: e.target.value })} />
          <input placeholder="PIN Wondr" value={form.pinWondr} onChange={e => setForm({ ...form, pinWondr: e.target.value })} />
          <input placeholder="Password Wondr" type="password" value={form.passWondr} onChange={e => setForm({ ...form, passWondr: e.target.value })} />
          <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Password Email" type="password" value={form.passEmail} onChange={e => setForm({ ...form, passEmail: e.target.value })} />
          <input placeholder="Expired (YYYY-MM-DD)" value={form.expired} onChange={e => setForm({ ...form, expired: e.target.value })} />
          {bank === 'BCA' && (
            <>
              <input placeholder="User myBCA" value={form.myBCAUser} onChange={e => setForm({ ...form, myBCAUser: e.target.value })} />
              <input placeholder="Password myBCA" type="password" value={form.myBCAPassword} onChange={e => setForm({ ...form, myBCAPassword: e.target.value })} />
            </>
          )}
          {bank === 'BRI' && (
            <>
              <input placeholder="User BRImo" value={form.brimoUser} onChange={e => setForm({ ...form, brimoUser: e.target.value })} />
              <input placeholder="Password BRImo" type="password" value={form.brimoPassword} onChange={e => setForm({ ...form, brimoPassword: e.target.value })} />
              <input placeholder="User BRI Merchant" value={form.briMerchantUser} onChange={e => setForm({ ...form, briMerchantUser: e.target.value })} />
              <input placeholder="Password BRI Merchant" type="password" value={form.briMerchantPassword} onChange={e => setForm({ ...form, briMerchantPassword: e.target.value })} />
            </>
          )}
          <label>Upload Foto KTP: <input type="file" accept="image/*" onChange={e => setFotoKTP(e.target.files[0] || null)} /></label>
          <label>Upload Foto Selfie: <input type="file" accept="image/*" onChange={e => setFotoSelfie(e.target.files[0] || null)} /></label>
          <button onClick={handleSubmit}>Kirim</button>
          {statusMsg && <p>{statusMsg}</p>}
        </div>
      </div>
    </div>
  );
}

export default TelegramProductForm;
