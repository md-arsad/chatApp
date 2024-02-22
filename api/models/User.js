const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {type:String, unique:true},
  password: String,
}, {timestamps: true});

const UserModel = mongoose.model('userdata', UserSchema);
module.exports = UserModel;   