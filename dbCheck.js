const mongoose = require('mongoose');
const Listing = require('./models/listing');

const MONGO_URL = 'mongodb://127.0.0.1:27017/wanderlust';

async function main(){
  await mongoose.connect(MONGO_URL);
  const list = await Listing.find({}).limit(30).lean();
  list.forEach((l,i)=>{
    console.log(i+1, 'id:', String(l._id), 'image type:', typeof l.image, 'image value:', l.image);
  });
  await mongoose.disconnect();
}

main().catch(err=>{console.error(err); process.exit(1);});