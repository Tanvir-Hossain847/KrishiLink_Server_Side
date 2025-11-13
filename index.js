const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 3000
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// middlewere
app.use(cors())
app.use(express.json())

const uri = "mongodb+srv://skeletonDB:oDiHqEmt7A1Z8f0a@tanvir369.ymezqkm.mongodb.net/?appName=Tanvir369";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.get('/' , (req, res) => {
    res.send("the server is running from port 3000")
})

async function run() {
    try {
        await client.connect()

        const skeletonDB = client.db("skeletondb")
        const collection = skeletonDB.collection("products")

        // post operations
        app.post('/myproducts', async(req, res) => {
            const newProducts = req.body;
            const result = await collection.insertOne(newProducts)
            res.send(result)
            console.log("the result is", result);
            
        })

        //delete operations
        // app.delete('/myproducts/:id', async(req, res) => {
        //     const id = req.params.id
        //     const query = {_id: new ObjectId(id)}
        //     const result = await collection.deleteOne(query)
        //     res.send(result)
        // })

        // // update operations
        // app.patch('/myproducts/:id', async (req, res) =>{
        //     const id = req.params.id
        //     const query = {_id: new ObjectId(id)}
        //     const updateNEW = req.body
        //     const update = {
        //         $set: {
        //             title: updateNEW.title,
        //             price: updateNEW.price
        //         }
        //     }
// 
        //     const result = await collection.updateOne(query, update)
        //     res.send(result)
        // })

        //get operations
        app.get('/myproducts', async ( req, res ) => {
            const cursor = collection.find().sort({_id: 1})
            const result = await cursor.toArray()
            res.send(result)
        })

        //get a single 
        app.get('/myproducts/:id', async (req,res) => {
            const id = req.params.id
            const query = {_id: new ObjectId(id)}
            const result = await collection.findOne(query)
            res.json(result)
        })

        //get my post via email
        app.get('/myposts', async (req, res) => {
            const email = req.query.email
            const query = {"owner.ownerEmail": email}
            const result = await collection.find(query).toArray()
            res.send(result)
        })

        //post my interest
        app.post('/interests', async (req, res) => {
            try{
                const {cropId,userEmail,userName,quantity,message} = req.body;
                const query = {_id: new ObjectId(cropId)}
                const crop = await collection.findOne(query)
                const interestId = new ObjectId()
                const newInterest = {
                    _id: interestId,
                    cropId,
                    userEmail,
                    userName,
                    quantity,
                    message,
                    status : "pending"
                };

                const alreadyInterested = crop.interests?.some((i) => i.userEmail === userEmail)
                if(alreadyInterested){
                    return res.status(409).json({error: "You Already Send Interest In This Crop"})
                }

                const updateresult = await collection.updateOne(
                    query,
                    {$push: {interests: newInterest}}
                )    
    
                if(updateresult.modifiedCount === 0){
                    return res.status(500).send({error: "Failed To Update Interest"})
                }
                res.status(201).send({message: "Interest Updated Succesfully", interest: newInterest})
            } catch(error){
                console.log(error);
                res.status(500).send({error: "Internal Server Error"})
            }
            
        });

        //get my interest via email
        app.get('/interests', async (req, res) => {
            const email = req.query.email
            const cursor = collection.find({interests: {$elemMatch: {userEmail: email}}})
            const result = await cursor.toArray()
            res.send(result)
        })

        app.delete('/interests', async (req, res) => {
            console.log(req.body);
            
            const { interestId } = req.body
            const result = await collection.updateOne(
                { "interests._id": new ObjectId(interestId)},
                {$pull:{interests : {_id: new ObjectId(interestId)}}}
            )
            res.status(200).send({message: "Deleted Interest Successfully"})
        })

        await client.db("admin").command({ ping: 1 });
         console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } 
    finally {
        //  await client.close();
    }
}

run().catch(console.dir)

app.listen(port, () =>{
    console.log(`this server is running on ${port}`);
})


 
