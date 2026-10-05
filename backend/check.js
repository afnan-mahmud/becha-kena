const { MongoClient } = require('mongodb');
const uri = 'mongodb://afnanmahmudsecond_db_user:9K4plUeyuFYNxim9@ac-uastugo-shard-00-00.nurjpmu.mongodb.net:27017,ac-uastugo-shard-00-01.nurjpmu.mongodb.net:27017,ac-uastugo-shard-00-02.nurjpmu.mongodb.net:27017/?ssl=true&replicaSet=atlas-jk5x83-shard-0&authSource=admin&appName=Cluster0';

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test'); // Or whatever DB name it is
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
