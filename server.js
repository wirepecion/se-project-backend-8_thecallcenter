const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const {xss} = require('express-xss-sanitizer');
const hpp = require('hpp');
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

// Load env vars
dotenv.config({path: './config/config.env'});

connectDB();

// Route files
const hotels = require ('./routes/hotels');
const bookings = require('./routes/bookings');
const reviews = require('./routes/reviews');
const rooms = require('./routes/rooms');
const payments = require('./routes/payments');
const auth = require('./routes/auth');
const rateLimit = require('express-rate-limit');
    
const app=express();

//Rate limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, //10 mins
    max: 100
});

const swaggerOptions={
    swaggerDefinition:{
    openapi: '3.0.0',
    info: {
    title: 'Library API',
    version: '1.0.0',
    description: 'A simple Express VacQ API'
    }
    },
    apis:['./routes/*.js'],
};
const swaggerDocs=swaggerJsDoc(swaggerOptions);


// Body parser
app.use(express.json());
app.use(mongoSanitize());
app.use(helmet());
app.use(xss());
app.use(limiter);
app.use('/api/v1/hotels',hotels);
app.use('/api/v1/bookings',bookings);
app.use('/api/v1/reviews',reviews);
app.use('/api/v1/rooms',rooms);
app.use('/api/v1/payments',payments);
app.use('/api/v1/auth',auth);

//Prevent http param pollution
app.use(hpp());

//Enable CORS
app.use(cors());

// Cookie parser
app.use(cookieACParser());

app.use('/api-docs',swaggerUI.serve, swaggerUI.setup(swaggerDocs));

const PORT=process.env.PORT || 5000;

// const server = app.listen (PORT, console.log('Server running in ', process.env.NODE_ENV, ' mode on port', PORT));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err,promise)=>{
    console.log(`Error: ${err.message}`); 
    //Close server & exit process 
    server.close(()=>process.exit(1));
});

if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
  
  module.exports = app;