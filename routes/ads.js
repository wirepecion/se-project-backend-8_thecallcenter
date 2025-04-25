const express = require('express');
const { randomBanners } = require('../controllers/ads');

//Incluse other resource routers
const router = express.Router();

//Re-route into other resource routers

router.route('/').get(randomBanners);

module.exports = router;