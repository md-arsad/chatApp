const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const cookieParser=require("cookie-parser")
const User = require("./models/User.js");
const Message=require("./models/Message.js")
const JWT = require("jsonwebtoken");
const dbConnect = require("./dbConnect.js");
const cors = require("cors");
const bcrypt = require('bcrypt');
const ws =require("ws")
const fs=require('fs')
dbConnect(); 

const jwtSecret = process.env.JWT_SECTRET;

const app = express();
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(cookieParser());
app.use(express.json());

app.use(cors({
  credentials:true,
  origin:process.env.CLIENT_URL, 
}));

app.get("/", (req, res) => {
  res.json("Home page");
});

app.get("/test", (req, resp) => {
  resp.json("Test ok");
});

// *********************
async function getUserDataFromRequest(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      JWT.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) throw err;
        resolve(userData);
      });
    } else {
      reject('no token');
    }
  });

}

app.get('/messages/:userId', async (req,res) => {
  const {userId} = req.params;
  const userData = await getUserDataFromRequest(req);
  const ourUserId = userData.userId;
  // console.log("index",userId)
  // console.log("index",ourUserId)
  const messages = await Message.find({
    sender:{$in:[userId,ourUserId]},
    recipient:{$in:[userId,ourUserId]},
  }).sort({createdAt: 1});
  res.json(messages);
});
// ********************************
app.get('/profile', (req,res) => {
  const token = req.cookies?.token;
  if (token) {
    JWT.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  } else {
    res.status(401).json('no token');
  }
});

// ***********
app.get('/people', async (req,res) => {
  const users = await User.find({}, {'_id':1,username:1});
  res.json(users);
});


// Register 
const bcryptSalt = bcrypt.genSaltSync(10); // Move the salt generation here
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  // console.log("user:",username)
  // console.log("password:",password)

  try {
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
    const createdUser = await User.create({
      username: username,
      password: hashedPassword, 
    });
    console.log("created",createdUser)
    JWT.sign({ userId: createdUser._id, username }, jwtSecret, {}, (err, token) => {
      if (err) throw err;
      res.cookie('token', token, { sameSite: 'none', secure: true }).status(201).json({
        id: createdUser._id,
        username
      });
    });
  } catch (err) { 
    console.error(err);    
    res.status(500).json({ error: err.message }); 
  }
});


// Login functionality
app.post('/login', async (req,res) => {
  const {username, password} = req.body;
  const foundUser = await User.findOne({username});
  if (foundUser) {
    const passOk = bcrypt.compareSync(password, foundUser.password);
    if (passOk) {
      JWT.sign({userId:foundUser._id,username}, jwtSecret, {}, (err, token) => {
        res.cookie('token', token, {sameSite:'none', secure:true}).json({
          id: foundUser._id,
        });
      });
    } 
  }
});


// ********* logout
app.post('/logout', (req,res) => {
  res.cookie('token', '', {sameSite:'none', secure:true}).json('ok');
});



const server=app.listen(5100, () => {
  console.log("app is running at port 5100");
}); 

const wss=new ws.WebSocketServer({server});

wss.on('connection',(connection,req)=>{


  function notifyAboutOnlinePeople() {
    [...wss.clients].forEach(client => {
      client.send(JSON.stringify({
        online: [...wss.clients].map(c => ({userId:c.userId,username:c.username})),
      }));
    }); 
  }

  connection.isAlive = true;
  connection.timer = setInterval(() => {
    connection.ping();
    connection.deathTimer = setTimeout(() => {
      connection.isAlive = false;
      clearInterval(connection.timer);
      connection.terminate();
      notifyAboutOnlinePeople();
      console.log('dead');
    }, 1000);
  }, 5000);


  connection.on('pong', () => {
    clearTimeout(connection.deathTimer);
  });

  // read the username and id from this cookie connection 
  const cookies=req.headers.cookie;
  // console.log("vknkj",cookies)
  if(cookies){
    const tokenCookiesString=cookies.split(';').find(str=>str.startsWith('token='));
    // console.log(tokenCookiesString)
    if(tokenCookiesString){
      const token=tokenCookiesString.split('=')[1];
      if (token) {
        JWT.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) throw err;
          const {userId,username}=userData;
          connection.userId=userId;
          connection.username=username;
        });
      }
    }
  }


  connection.on('message', async (message) => {
    const messageData = JSON.parse(message.toString());
    const {recipient, text, file} = messageData;
    let filename = null;
    if (file) {
      console.log('size', file.data.length);
      const parts = file.name.split('.');
      const ext = parts[parts.length - 1];
      filename = Date.now() + '.'+ext;
      const path = __dirname + '/uploads/' + filename;
      const bufferData = new Buffer(file.data.split(',')[1], 'base64');
      fs.writeFile(path, bufferData, () => {
        console.log('file saved:'+path);
      });
    }
    if (recipient && (text || file)) {
      const messageDoc = await Message.create({
        sender:connection.userId,
        recipient,
        text,
        file: file ? filename : null,
      });
      console.log('created message');
      [...wss.clients]
        .filter(c => c.userId === recipient)
        .forEach(c => c.send(JSON.stringify({
          text,
          sender:connection.userId,
          recipient,
          file: file ? filename : null,
          _id:messageDoc._id,
        })));
    }
  });
  // console.log([...wss.clients].map(c=>c.username));
  notifyAboutOnlinePeople()
});
