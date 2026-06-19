const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors')
const app = express()
const port = 5000
require('dotenv').config();

app.use(cors());
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

const uri = process.env.MONGO_DB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // await client.connect();

    const database = client.db("raktanex");
    const CreateDonationRequestCollection = database.collection("CreateDonationRequest")

// blood-donation-request
    app.post('/api/donation-request', async (req, res) => {
      const donations = req.body;
      const result = await CreateDonationRequestCollection.insertOne(donations);
      res.send(result)
    })

    app.get('/api/myDonations', async (req, res) => {
  const query = {};

  if (req.query.requesterId) {
    query.requesterId = req.query.requesterId;
  }

  if (req.query.donationStatus) {
    query.donationStatus = req.query.donationStatus;
  }

  const cursor = CreateDonationRequestCollection.find(query);
  const result = await cursor.toArray();

  res.send(result);
});










    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

    // await client.close();
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})