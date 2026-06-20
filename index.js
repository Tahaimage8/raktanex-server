const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express();
const port = 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const uri = process.env.MONGO_DB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    const database = client.db("raktanex");
    const CreateDonationRequestCollection = database.collection(
      "CreateDonationRequest",
    );
    const UserCollection = database.collection("user");

    app.patch("/api/admin/donation-requests/:id/status", async (req, res) => {
      const id = req.params.id;
      const donationStatus = req.body.donationStatus;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid donation request id" });
      }

      const validStatuses = ["pending", "inprogress", "done", "canceled"];

      if (!validStatuses.includes(donationStatus)) {
        return res.status(400).send({ message: "Invalid status value" });
      }

      const result = await CreateDonationRequestCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            donationStatus: donationStatus,
          },
        },
      );

      res.send(result);
    });
    // admin volenter
    app.get("/api/admin/donation-requests/:id", async (req, res) => {
      const id = req.params.id;

      const result = await CreateDonationRequestCollection.findOne({
        _id: new ObjectId(id),
      });

      if (!result) {
        return res.status(404).send({ message: "Donation request not found" });
      }

      res.send(result);
    });
    // admin/volunteer: delete ANY donation request (no requesterId check)
    app.delete("/api/admin/donation-requests/:id", async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid donation request id" });
      }

      const result = await CreateDonationRequestCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    // get all  donation  public
    app.get("/api/donation-requests", async (req, res) => {
      const cursor = CreateDonationRequestCollection.find().sort({
        _id: -1,
      });

      const result = await cursor.toArray();

      res.send(result);
    });

    //  get all users (with pagination + status filter) - admin only
    app.get("/api/users", async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const query = {};

      if (req.query.status) {
        query.status = req.query.status;
      }

      const totalUsers = await UserCollection.countDocuments(query);

      const cursor = UserCollection.find(query)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit);

      const result = await cursor.toArray();

      res.send({
        users: result,
        totalUsers: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page,
      });
    });

    // update user status
    app.patch("/api/users/:id/status", async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid user id" });
      }

      if (status !== "active" && status !== "blocked") {
        return res.status(400).send({ message: "Invalid status value" });
      }

      const result = await UserCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: status,
          },
        },
      );

      res.send(result);
    });

    // update user role
    app.patch("/api/users/:id/role", async (req, res) => {
      const id = req.params.id;
      const role = req.body.role;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid user id" });
      }

      const validRoles = ["donor", "volunteer", "admin"];

      if (!validRoles.includes(role)) {
        return res.status(400).send({ message: "Invalid role value" });
      }

      const result = await UserCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            role: role,
          },
        },
      );

      res.send(result);
    });

    // update user profile

    app.patch("/api/users/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;

      const result = await UserCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            name: data.name,
            image: data.image,
            district: data.district,
            upazila: data.upazila,
            bloodGroup: data.bloodGroup,
          },
        },
      );

      res.send(result);
    });

    // blood-donation-request
    app.post("/api/donation-request", async (req, res) => {
      const donations = req.body;
      const result = await CreateDonationRequestCollection.insertOne(donations);
      res.send(result);
    });

    app.get("/api/myDonations", async (req, res) => {
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

    // view-donation-request

    app.get("/api/donation-request/:id", async (req, res) => {
      const id = req.params.id;
      const requesterId = req.query.requesterId;

      if (!requesterId) {
        return res.status(401).send({ message: "Requester id is required" });
      }

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid donation request id" });
      }

      const result = await CreateDonationRequestCollection.findOne({
        _id: new ObjectId(id),
        requesterId: requesterId,
      });

      if (!result) {
        return res.status(404).send({ message: "Donation request not found" });
      }

      res.send(result);
    });

    // update-donation-request
    app.patch("/api/donation-request/:id", async (req, res) => {
      const id = req.params.id;
      const requesterId = req.query.requesterId;
      const data = req.body;

      if (!requesterId) {
        return res.status(401).send({ message: "Requester id is required" });
      }

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid donation request id" });
      }

      const updateData = {
        recipientName: data.recipientName,
        recipientDivision: data.recipientDivision,
        recipientDistrict: data.recipientDistrict,
        recipientUpazila: data.recipientUpazila,
        hospitalName: data.hospitalName,
        fullAddress: data.fullAddress,
        bloodGroup: data.bloodGroup,
        donationDate: data.donationDate,
        donationTime: data.donationTime,
        requestMessage: data.requestMessage,
      };

      const result = await CreateDonationRequestCollection.updateOne(
        {
          _id: new ObjectId(id),
          requesterId: requesterId,
        },
        {
          $set: updateData,
        },
      );

      res.send(result);
    });

    // delete-donation-request
    app.delete("/api/donation-request/:id", async (req, res) => {
      const id = req.params.id;
      const requesterId = req.query.requesterId;

      if (!requesterId) {
        return res.status(401).send({ message: "Requester id is required" });
      }

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid donation request id" });
      }

      const result = await CreateDonationRequestCollection.deleteOne({
        _id: new ObjectId(id),
        requesterId: requesterId,
      });

      res.send(result);
    });
    // status change

    app.patch("/api/donation-request-status/:id", async (req, res) => {
      const id = req.params.id;
      const requesterId = req.query.requesterId;
      const donationStatus = req.body.donationStatus;

      if (!requesterId) {
        return res.status(401).send({ message: "Requester id is required" });
      }

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid donation request id" });
      }

      const result = await CreateDonationRequestCollection.updateOne(
        {
          _id: new ObjectId(id),
          requesterId: requesterId,
        },
        {
          $set: {
            donationStatus: donationStatus,
          },
        },
      );

      res.send(result);
    });

    // get all pending donation  public
    app.get("/api/donation-requests", async (req, res) => {
      const query = {
        donationStatus: "pending",
      };

      const cursor = CreateDonationRequestCollection.find(query).sort({
        _id: -1,
      });

      const result = await cursor.toArray();

      res.send(result);
    });

    //  get single data pending donation  private
    app.get("/api/donation-requests/:id", async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid donation request id" });
      }

      const result = await CreateDonationRequestCollection.findOne({
        _id: new ObjectId(id),
      });

      if (!result) {
        return res.status(404).send({ message: "Donation request not found" });
      }

      res.send(result);
    });

    // confirm donation from private details page
    app.patch("/api/donation-requests/:id/donate", async (req, res) => {
      const id = req.params.id;
      const donorInfo = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid donation request id" });
      }

      if (!donorInfo.donorName || !donorInfo.donorEmail) {
        return res
          .status(400)
          .send({ message: "Donor information is required" });
      }

      const result = await CreateDonationRequestCollection.updateOne(
        {
          _id: new ObjectId(id),
          donationStatus: "pending",
        },
        {
          $set: {
            donationStatus: "inprogress",
            donorName: donorInfo.donorName,
            donorEmail: donorInfo.donorEmail,
          },
        },
      );

      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
