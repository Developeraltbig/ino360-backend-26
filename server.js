const express = require("express"); // A web application framework for Node.js that simplifies routing, middleware integration, and server-side logic.
const cors = require("cors"); // Allows cross-origin requests.
const multer = require("multer"); // Handles file uploads.
const fs = require("fs"); // Interacts with the file system.
const axios = require("axios"); // Makes HTTP requests.
const pdf = require("pdf-parse"); // Extracts content from PDF files.
const mammoth = require("mammoth"); // Converts DOCX files to HTML or plain text.
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const Registration = require('./models/Registration');
const { loginUser } =  require('./models/login'); 



require("dotenv").config();

const app = express();
// const PORT = process.env.PORT || 5000;

mongoose.connect('mongodb+srv://nehajaiswal:neha123@nehadb.pcorgpc.mongodb.net/ino360')
  .then(()=>console.log('MongoDB Connected Successfully'))
  .catch(() => console.log('MongoDB Connection error:'))



  app.get('/',(req,res) => {
    res.send('Server is Running!')
  })


// app.use(cors());
app.use(cors({
    origin: 'https://ino360-frontend-26.vercel.app', // Replace with your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify the methods you want to allow
    allowedHeaders: ["Content-Type", "Authorization"], // Specify the headers you want to allow
}));
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });


// sign up API

app.post('/register', async (req,res) => {

  const{name,email,password} = req.body
  try{
    if(!name || !email || !password){
      return res.status(400).json({message: 'All fields are required'})

    }

    const existingUser = await Registration.findOne({email})
    if(existingUser){
      return res.status(400).json({message: 'Email already registered'});
    }
    
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password,salt);

    const newUser = new Registration({
      name,
      email,
      password:hashedPassword,

    })

    await newUser.save()
    res.status(201).json({message:'User Registration Successfully'});
  }
  catch{
    console.error(error);
    res.status(500).json({message:'Server error, please try Again'});
  }
})


app.post('/login',async(req,res) => {
  const {email,password} = res.body;

  try {
    if(!email || !password){
      return res.status(400).json({message:'Email and password are required'});
    }
    const user = await loginUser(email,password)
    res.status(200).json({message:'Login Successfully',user });
  }catch(error){
    res.status(400).json({message:error.message})
  }
})


// Endpoint to upload files
app.post("/upload", upload.single("file"), async (req, res) => {
  const fileBuffer = req.file.buffer;
  const fileType = req.file.mimetype;

  let extractedText = "";

  try {
    if (fileType === "application/pdf") {
      extractedText = (await pdf(fileBuffer)).text;
    } else if (
      fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const { value } = await mammoth.extractRawText({ buffer: fileBuffer });
      extractedText = value;
    } else {
      return res.status(400).send({ error: "Unsupported file type." });
    }

    res
      .status(200)
      .send({ message: "File uploaded successfully!", text: extractedText });
  } catch (error) {
    console.error("Error extracting text from file:", error);
    res.status(500).send({ error: "Error extracting text from file" });
  }
});

// Endpoint to chat with PDF using Gemini API

app.post("/chat", async (req, res) => {
  try {
    const query = req.body.query;

    // Check if the PDF file exists before sending the request
    if (!fs.existsSync("temp.pdf")) {
      return res.status(400).send({ error: "PDF file not found." });
    }

    // Send PDF data as required by the Gemini API
    const pdfBase64 = fs.readFileSync("temp.pdf").toString("base64"); // Read PDF as base64

    const response = await axios.post(
      "https://api.gemini.com/v1/chat",
      {
        pdf: pdfBase64, // Sending PDF as base64 encoded string
        query: query,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Check if response contains expected data
    if (response.data && response.data.answer) {
      res.status(200).send({ answer: response.data.answer });
    } else {
      res.status(500).send({ error: "No answer returned from Gemini API" });
    }
  } catch (error) {
    console.error("Error in /chat endpoint:", error.message); // Log specific error message
    res.status(500).send({
      error: "Error communicating with Gemini API",
      details: error.message,
    });
  }
});





app.listen(5000, () => {
  console.log("Server listening on http://localhost:5000");
});
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
