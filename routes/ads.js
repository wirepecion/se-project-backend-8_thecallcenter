const express = require('express');
const { randomBanners } = require('../controllers/ads');

const router = express.Router();

router.route('/').get(randomBanners);

module.exports = router;

/**
 * @swagger
 * /ads:
 *   get:
 *     summary: Get 5 random hotel banners based on subscription rank
 *     tags:
 *       - Ads
 *     responses:
 *       200:
 *         description: A list of randomly selected hotel banners
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: Hotel Paradise
 *                       picture:
 *                         type: string
 *                         example: https://example.com/image.jpg
 *                       address:
 *                         type: string
 *                         example: 123 Beach Road
 *                       tel:
 *                         type: string
 *                         example: 0123456789
 *       404:
 *         description: No hotels found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: No hotels found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Server error
 */