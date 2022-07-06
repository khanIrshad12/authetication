
require('dotenv').config({ path: '.env'});
const express = require("express");
const ejs = require("ejs");
const cookieParser = require('cookie-parser');
const bodyparser=require("body-parser");
const mongoose =require("mongoose");
const passport =require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require("mongoose-findorcreate")
const session =require("express-session");
const app=express();
app.use(express.static("public"));
app.use(cookieParser());
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
    password:String,
    googleId:String,
    facebookId:String,
   username:String,
    token: String,
    name: String,
    gender: String,
    pic: String
   
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
mongoose.connect("mongodb://localhost:27017/UserDB");
const user = mongoose.model("user",userSchema);
passport.use(user.createStrategy());
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id});
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    UserProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo" 
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    user.findOrCreate({username: profile.emails[0].value ,googleId: profile.id}, function (err, user) {
      return cb(err, user);
    });
  }
));
//for facebook
passport.use(new FacebookStrategy({
    clientID:process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets",
    //enableProof: true
    profileFields: ['id', 'displayName', 'name', 'gender', 'picture.type(large)','email']
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    process.nextTick(function() {
 
      // find the user in the database based on their facebook id
      user.findOne({username: profile.emails[0].value,  'facebookId' : profile.id }, function(err, User) {

          // if there is an error, stop everything and return that
          // ie an error connecting to the database
          if (err)
              return cb(err);

          // if the user is found, then log them in
          if (User) {
              console.log("user found")
              console.log(User)
              return cb(null, User); // user found, return that user
          } else {
              // if there is no user found with that facebook id, create them
              var newUser            = new user();

              // set all of the facebook information in our user model
              newUser.facebookId    = profile.id; // set the users facebook id                  
               // we will save the token that facebook provides to the user                    
              newUser.username  = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
              newUser.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first
              newUser.gender = profile.gender
              newUser.pic = profile.photos[0].value
              // save our user to the database
              newUser.save(function(err) {
                  if (err)
                      throw err;

                  // if successful, return the new user
                  return cb(null, newUser);
              });
          }

      });

  })
  }
));

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
    
});

//for google
app.get('/auth/google',
passport.authenticate('google', { scope: ['profile',"email"] }));

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  });

  //for facebook
  app.get('/auth/facebook',
  passport.authenticate('facebook',{scope:["email","user_photos"]}));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets page
    res.redirect('/secrets');
  });


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