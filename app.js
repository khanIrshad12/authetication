
require('dotenv').config({ path: '.env'});
const express = require("express");
const ejs = require("ejs");
const bodyparser=require("body-parser");
const mongoose =require("mongoose");
const passport =require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const session =require("express-session");
const app=express();
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyparser.urlencoded({
    extended:true
}));
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
  }));
app.use(passport.initialize());
app.use(passport.authenticate('session'));

const userSchema = new mongoose.Schema({
    email:String,
    password:String
});
userSchema.plugin(passportLocalMongoose);
mongoose.connect("mongodb://localhost:27017/userDB");
const user = mongoose.model("user",userSchema);
passport.use(user.createStrategy());

passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

app.get("/",(req,res)=>{
    res.render("home");
});

app.get("/login",(req,res)=>{
    res.render("login");
});
app.get("/logout",(req,res)=>{
    req.logout((err)=>{
        if(!err){
            res.redirect("/");
        }
    });
   
})
app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.render("login");
    }
    
})

app.get("/register",(req,res)=>{

    res.render("register");
});

app.post("/register",(req,res)=>{
    user.register({username:req.body.username},req.body.password, function(err, User) {
        if (err) {

            console.log(err);
            res.send("/register");
         }else{
            passport.authenticate('local')(req,res,function(){
                res.redirect("/secrets");
            });
           
         }
});
});
app.post("/login",(req,res)=>{
    const User = new user({
        username:req.body.username,
        password:req.body.password
    });

   req.login(User,function(err){
    if (err) {

        console.log(err);
        res.send("something went wrong please again");
     }else{
        passport.authenticate('local')(req,res,function(){
            res.redirect("/secrets");
        });
       
     }

   })
});








app.listen(3000,()=>{
    console.log("connected to server!!");
})