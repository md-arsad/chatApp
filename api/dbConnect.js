// const mongoose = require("mongoose");
// require("dotenv").config();
// const dbConnect = async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URL
//         // , {
//         //     useNewUrlParser: true,
//         //     useUnifiedTopology: true,
//         // }
//     );

//     console.log("Database connected successfully :");
//   } catch (error) {
//     console.log("Database error", error);
//     process.exit(1);
//   }
// };

// module.exports = dbConnect;

const { default: mongoose, connection } = require("mongoose")
const dbConnet= async ()=>{
    try{
        const connect= await mongoose.connect(process.env.MONGODB_URL, {
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
            // serverSelectionTimeoutMS: 5000, // Adjust the timeout as needed
            // family: 4, // Use IPv4
        });
        console.log("Database connected successfully :");
    }   
    catch(error){
        console.log("Database error");   
        process.exit(1) ; 
    }  
}
module.exports=dbConnet;  