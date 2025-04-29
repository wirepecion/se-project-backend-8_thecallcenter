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
const ads = require('./routes/ads');
const auth = require('./routes/auth');
const rateLimit = require('express-rate-limit');
    
const app=express();

//Rate limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, //10 mins
    max: 10000
});

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'VacQ Hotel API',
            version: '1.0.0',
            description: 'API documentation for hotel booking system',
        },
        servers: [
            {
            url: 'http://localhost:5000/api/v1',
            },
        ],
        components: {
            securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
            },
        },
        security: [
            {
            bearerAuth: [],
            },
        ],
    },
    apis: ['./routes/*.js', './controllers/*.js'],
};  
  
const swaggerDocs=swaggerJsDoc(swaggerOptions);

//Enable CORS
app.use(cors());

// Body parser
app.use(express.json());
app.use(mongoSanitize());
app.use(xss());
app.use(limiter);
app.use(
    helmet({
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
            styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
            imgSrc: ["'self'", 'data:', 'cdn.jsdelivr.net'],
            },
        },
    })
);

// app.use("/api", require("./routes/email"))
app.use('/api/v1/hotels', hotels);
app.use('/api/v1/bookings', bookings);
app.use('/api/v1/reviews', reviews);
app.use('/api/v1/rooms', rooms);
app.use('/api/v1/payments', payments);
app.use('/api/v1/ads', ads);
app.use('/api/v1/auth', auth);


//Prevent http param pollution
app.use(hpp());

// Cookie parser
app.use(cookieParser());

app.use('/api-docs',swaggerUI.serve, swaggerUI.setup(swaggerDocs));

const PORT=process.env.PORT || 5000;

// const server = app.listen (PORT, console.log('Server running in ', process.env.NODE_ENV, ' mode on port', PORT));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err,promise)=>{
    console.log(`Error: ${err.message}`); 
    // Close server & exit process 
    server.close(()=>process.exit(1));
});

if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
  
module.exports = app;