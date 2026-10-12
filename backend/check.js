// Debug helper: prints the 3 latest listings and their image URLs.
// Usage: MONGODB_URI="mongodb+srv://..." node check.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Set MONGODB_URI (e.g. in backend/.env) before running this script.');
  process.exit(1);
}

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const listings = db.collection('listings');
    const latest = await listings.find().sort({ createdAt: -1 }).limit(3).toArray();
    latest.forEach(doc => {
      console.log(`ID: ${doc._id}, Title: ${doc.title}, Images:`, doc.images);
    });
  } finally {
    await client.close();
  }
}
main().catch(console.error);
