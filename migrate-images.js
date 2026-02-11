const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Listing = require('../models/listing');

const MONGO_URL = 'mongodb://127.0.0.1:27017/wanderlust';

async function main() {
  await mongoose.connect(MONGO_URL);
  console.log('connected to DB');

  // Find listings where image is an object with a url property
  const affected = await Listing.find({ 'image.url': { $exists: true } }).lean();
  console.log(`Found ${affected.length} listing(s) with object image field.`);

  if (affected.length === 0) {
    await mongoose.disconnect();
    return;
  }

  // backup
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `image-objects-backup-${ts}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(affected, null, 2), 'utf8');
  console.log(`Backup written to ${backupPath}`);

  // Apply migration
  let updatedCount = 0;
  for (const doc of affected) {
    try {
      const id = doc._id;
      const url = doc.image && doc.image.url;
      if (url && typeof url === 'string' && url.length > 0) {
        await Listing.updateOne({ _id: id }, { $set: { image: url } });
        updatedCount++;
      }
    } catch (e) {
      console.error('Failed to update doc', doc._id, e);
    }
  }

  console.log(`Updated ${updatedCount} listing(s).`);

  await mongoose.disconnect();
  console.log('done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});