import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
    Username:{type:String,required:true,min:4,unique:true},
    Password:{type:String,required:true}
})
const User = mongoose.model('User',userSchema);

export default User;    