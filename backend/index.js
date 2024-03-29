const express = require("express");
const cors = require("cors");
require('./db/config');
const app = express();

const User = require("./db/User");
const Product = require("./db/Product");

const Jwt = require('jsonwebtoken');
const jwtKey = 'e-comm';

app.use(express.json());
app.use(cors());

app.post("/register", async (req, res) => {
    let user = new User(req.body);
    let result = await user.save();
    result = result.toObject();
    delete result.password;
    Jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
            res.send({ result: "Something went wrong" });
        } else {
            res.send({ result, auth: token });
        }
    })
});

app.post("/login", async (req, res) => {
    if (req.body.email && req.body.password) {
        let user = await User.findOne(req.body).select("-password");
        if (user) {
            Jwt.sign({ user }, jwtKey, { expiresIn: "5h" }, (err, token) => {
                if (err) {
                    res.send({ result: "Something went wrong" });
                } else {
                    res.send({ user, auth: token });
                }
            })

        } else {
            res.send({ result: "user not found" });
        }
    } else {
        res.send({ result: "user not found" });
    }

});

app.post("/add-product", verifyToken, async (req, res) => {
    // console.log(req.body);
    let product = new Product(req.body);
    let result = await product.save();
    // result = result.toObject();
    res.send(result);
});

app.get("/products", verifyToken, async (req, res) => {
    let products = await Product.find().sort( { _id: -1 } );
    if (products.length > 0) {
        res.send(products);
    } else {
        res.send({ result: "No products found" });
    }
})


app.delete("/delete-product/:id",verifyToken,  async (req, res) => {
    let result = await Product.deleteOne({ _id: req.params.id });
    res.send(result);

})

app.get("/get-product/:id", verifyToken, async (req, res) => {
    let result = await Product.findOne({ _id: req.params.id });
    if (result) {
        res.send(result);
    } else {
        res.send({ result: "No record found" });
    }

})

app.put("/update-product/:id", verifyToken, async (req, res) => {
    let result = await Product.updateOne(
        { _id: req.params.id },
        { $set: req.body }
    );
    res.send(result);
})

app.get("/search/:key",verifyToken,  async (req, res) => {
    let result = await Product.find({
        "$or": [
            {
                name: { $regex: req.params.key }
            },
            {
                company: { $regex: req.params.key }
            },
            {
                category: { $regex: req.params.key }
            }
        ]
    });
    res.send(result);
})


function verifyToken(req, res, next) {
    let token = req.headers['authorization'];
    if (token) {
        Jwt.verify(token, jwtKey, (err, valid) => {
            if (err) {
                res.status(401).send({ result: "Token not valid" });
            } else {
                next();
            }
        })
    } else {
        res.status(403).send({ result: "Token missing.." });
    }
    

}

app.listen(5000);