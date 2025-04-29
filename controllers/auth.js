const { now } = require('mongoose');
const User = require('../models/User');

//@desc     Register user
//@route    POST /api/v1/auth/register
//@access   Public

exports.register = async (req, res, next) => {
    try {
        const { name, tel, email, password, } = req.body;

        //Create user
        const user = await User.create({
            name,
            tel,
            email,
            password,
            membershipTier: 'none',
            membershipPoints: 0
        });

        sendTokenResponse(user, 200, res);

    } catch (err) {
        res.status(400).json({success: false});
        console.log(err.stack);
    }
};

//@desc     Login user
//@route    POST /api/v1/auth/login
//@access   Public
exports.login = async (req, res, next) => {
    try{
        const { email, password } = req.body;

        //Validate email & password
        if (!email || !password) {
            return res.status(400).json({success: false, error: 'Please provide email and password'});
        }
    
        //Check for user
        const user = await User.findOne({ email }).select('+password');
    
        if (!user) {
            return res.status(401).json({success: false, error: 'Invalid credentials'});
        }
    
        //Check if password matches
        const isMatch = await user.matchPassword(password);
    
        if (!isMatch) {
            return res.status(401).json({success: false, error: 'Invalid credentials'});
        }
    
        sendTokenResponse(user, 200, res);
    }catch(error){
        res.status(401).json({success: false, msg: 'Cannot convert email or password to string'});
    }
};

//Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    //Create token
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res.status(statusCode).cookie('token', token, options).json({
        success: true, 
        token
    });
}

//@desc     Get current logged in user
//@route    GET /api/v1/auth/me
//@access   Private
exports.getMe = async (req, res) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({
        success: true, 
        data: user
    });
};

//@desc     Log user out / clear cookie
//@route    GET /api/v1/auth/logout
//@access   Private
exports.logout = async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        data: {}
    });
};


//@desc Reduce user credit
//@route POST /api/v1/auth/reduceCredit
//@access Private
exports.reduceCredit = async (req, res, next) => {
    try {
        const { amount } = req.body;
        const userId = req.body.user || req.user.id;
        const user = await User.findById(userId);

        if (req.body.userId && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                error: 'Forbidden' 
            });
        }

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        if (amount <= 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Amount must be greater than zero' 
            });
        }

        if (user.credit < amount) {
            return res.status(400).json({ 
                success: false, 
                error: 'Insufficient credit' 
            });
        }

        user.credit -= amount;
        await user.save();
        
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false });
        console.log(err.stack);
    }
};


//@desc     get all users
//@route    GET /api/v1/auth/users
//@access   Private
exports.getUsers = async (req, res, next) => {
    
    let query;
    const reqQuery = {...req.query};
    const removeFields = ['select','sort','page','limit','filter','search'];
    removeFields.forEach(param => delete reqQuery[param]);
    
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    let queryFilter = JSON.parse(queryStr);

    if (req.query.filter) {
        const filters = req.query.filter.split(",");
        queryFilter.membershipTier = { $in: filters }; 
        console.log(queryFilter.membershipTier);
         
    }
    if (req.query.search) {
        queryFilter.name = { $regex: req.query.search, $options: "i" }; 
        console.log(queryFilter.name);
    }
    queryObj = User.find(queryFilter)

    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = queryObj.select(fields);
    }

    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = queryObj.sort(sortBy);
    } else {
        query = queryObj.sort('-membershipPoints');
    }

    const statistic = await User.aggregate([
        {
            $group: {
                _id: "$membershipTier",
                totalUsers: { $sum: 1 },
            }
        },
        {
            $project: {
                _id: 1,
                totalUsers: 1,
                sortIndex: {
                    $indexOfArray: [
                        ["none", "bronze", "silver", "gold", "platinum", "diamond", null],
                        "$_id"
                    ]
                }
            }
        },
        {
            $sort: {
                sortIndex: 1
            }
        }
    ]);
    
    try {
        const total = await query.clone().countDocuments();
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 15;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        
        if(startIndex > total) {
            return res.status(400).json({
                success:false,
                message: 'This page does not exist'
            });
        }

        query = query.skip(startIndex).limit(limit).exec();
        const data = await query;
        
        const pagination = {};
        
        if (endIndex < total) {
            pagination.next = { page: page + 1, count: (endIndex+limit)>total?total-(startIndex+limit):limit };
        }
            
        if (startIndex > 0) {
            pagination.prev = { page: page - 1, count:limit };
        }

        const allUsers = await User.find(queryFilter);

        res.status(200).json({
            success: true,
            allUser: allUsers.length,
            allUsers: allUsers,
            statistic: statistic,
            count: endIndex > total ? total - startIndex : limit,
            totalPages: Math.ceil(total / limit),
            nowPage: page,
            pagination,
            data: data
        });
    } catch (error) {
        console.error(error.message);
        console.error(error);
        return res.status(400).json({success: false, message: 'Error fetching users'});
    }
}

//@desc     get one user
//@route    GET /api/v1/auth/users/:id
//@access   Private
exports.getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).populate({path: 'responsibleHotel', select: 'name'});

        if (!user) {
            return res.status(400).json({success:false});
        }

        res.status(200).json({success:true, data:user});
    } catch (err) {
        res.status(400).json({success:false});
    }
};

