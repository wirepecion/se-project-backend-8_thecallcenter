const express = require("express");
const { createReview, getReviews, getReview, updateReview, deleteReview, voteReview, changeVoteReview } = require("../controllers/reviews");
const {protect, authorize} = require('../middleware/auth');

const router = express.Router();

router.route("/")
    .get(protect, getReviews) // Get reviews
    .post(protect, authorize('admin', 'user'), createReview); // Add review

router.route("/:hotelId")
    .get(protect, getReviews) // Get reviews for a hotel
    .get(protect, getReview); // Get reviews for a hotel

router.route("/:reviewId")
    .put(protect, authorize('admin', 'user'), updateReview) // Update a review
    .delete(protect, authorize('admin', 'user'), deleteReview); // Delete review

router.route("/:reviewId/vote")
    .post(protect, authorize('admin', 'user'), voteReview) // Like/Dislike review
    .put(protect, authorize('admin', 'user'), changeVoteReview); // Like/Dislike review

module.exports = router;