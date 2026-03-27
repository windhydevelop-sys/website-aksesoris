const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load env
const envPath = process.env.NODE_ENV === 'development'
  ? path.join(__dirname, '.env.development')
  : path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const connectDB = require('./config/db');
const Product = require('./models/Product');

const checkExpired = async () => {
  try {
    await connectDB();
    const today = new Date();
    
    // Find all products that are ALREADY expired
    const expiredProducts = await Product.find({
      expired: { $lt: today },
      status: { $ne: 'cancelled' } // Only non-cancelled ones
    }).sort({ expired: -1 });

    console.log(`\nFound ${expiredProducts.length} expired product(s):`);
    
    expiredProducts.forEach((p, i) => {
      console.log(`\n${i + 1}. Product ID: ${p._id}`);
      console.log(`   Name: ${p.nama || 'Tanpa Nama'}`);
      console.log(`   Order No: ${p.noOrder || '-'}`);
      console.log(`   Bank: ${p.bank || '-'}`);
      console.log(`   Expired Date: ${p.expired ? p.expired.toLocaleDateString('id-ID') : 'N/A'}`);
      console.log(`   Status: ${p.status}`);
      console.log(`   Customer: ${p.customer || '-'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkExpired();
