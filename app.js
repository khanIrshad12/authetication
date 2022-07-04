
require('dotenv').config({ path: '.env'})
const express = require("express");
const ejs = require("ejs");
const bodyparser=require("body-parser");
const mongoose =require("mongoose");
let alert = require("alert");
const encrypt = require("mongoose-encryption");
const app=express();
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyparser.urlencoded({
    extended:true
}));
const userSchema = new mongoose.Schema({
    email:String,
    password:String
});
userSchema.plugin(encrypt, { secret: process.env.SECRET,encryptedFields: ['password'] });

mongoose.connect("mongodb://localhost:27017/userDB");
const user = mongoose.model("user",userSchema);


app.get("/",(req,res)=>{
    res.render("home");
});

app.get("/login",(req,res)=>{
    res.render("login");
});

app.get("/register",(req,res)=>{

    res.render("register");
});

app.post("/register",(req,res)=>{
   
    const Username=req.body.username;
    const Password = req.body.password;
    
    try{
     user.findOne({email:Username},(err,found)=>{
            
            if(found){    
                res.send('<script>alert("Email alreday exits");window.location="register"</script>')
                
            }else{
                const newUser = new user({
                    email:Username,
                    password:Password
                });
                
            newUser.save(function(err){
                if(!err){
                    res.render("secrets");
                }else{
                    res.render(err);
                }
            });
            }
       
    });

    }catch{
        console.log(err);
    }
 
   
});

app.post("/login",(req,res)=>{
    const email= req.body.username;
    const password = req.body.password;
    user.findOne({email:email},(err,found)=>{
        if(!err){
            
            console.log(found.email);
            console.log(found.password);
            if(password === found.password){
                
                res.render("secrets");

            }else{
                res.send("password not match😥☹");
            }
        }else{
            console.log(err);
        }
        

    })
   
});








app.listen(3000,()=>{
    console.log("connected to server!!");
})