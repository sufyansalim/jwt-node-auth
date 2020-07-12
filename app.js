const express = require('express');
const morgan = require('morgan');
const createError = require('http-errors');
require('dotenv').config();
require('./helpers/db.js')
const {verifyAccessToken} = require('./helpers/jwtHelper')
// const client = 
require('./helpers/redis')

// client.SET("foo","bar");

// client.GET("foo",(err,val)=>{
//     if(err) console.log(err.message)
//     console.log(val)
// })

const authRoute = require('./routes/auth');

const app = express();
app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.get('/',verifyAccessToken, async(req,res,next) => {
    res.send("HEloo")
})

app.use("/auth",authRoute)

app.use(async(req,res,next) => {
//    const error = new Error("Not Found");
//    error.status = 404;
//    next(error)
next(createError.NotFound());
})

app.use((err,req,res,next)=>{
    res.status(err.status || 500)
    res.send({
        error:{
           status: err.status || 500,
           message: err.message
        }
    })
})


const PORT =  process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});