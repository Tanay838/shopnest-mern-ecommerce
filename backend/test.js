const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://tanaybulsara_db_user:YOUR_PASSWORD@cluster0.rjduplt.mongodb.net/shopnest?retryWrites=true&w=majority";

const client = new MongoClient(uri);

async function test() {
  try {
    await client.connect();
    console.log("✅ MongoDB Connected Successfully!");
    await client.close();
  } catch (err) {
    console.error("❌", err);
  }
}

test();