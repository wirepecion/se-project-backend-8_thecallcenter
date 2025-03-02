const Review = require('../models/Review');
const mongoose = require('mongoose');
const Hotel = require('../models/Hotel');
const User = require('../models/User');
const Booking = require('../models/Booking');

//@desc     Get all reviews
//@route    GET /api/v1/reviews
//@access   Public
exports.getReviews = async (req, res, next) => {
  try {
      let reviews;

      if (req.params.hotelId) {
          reviews = await Review.find({
              hotel: new mongoose.Types.ObjectId(req.params.hotelId)
          }).populate("user", "name");
      } else {
          reviews = await Review.find().populate("user", "name");
      }

      res.status(200).json({
          success: true,
          count: reviews.length,
          data: reviews
      });
  } catch (err) {
      res.status(400).json({ success: false, message: err.message });
  }
};


//@desc     Get single review
//@route    GET /api/v1/reviews/:id
//@access   Public
exports.getReview = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate if ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid review ID format" });
    }

    const review = await Review.findById(id).populate("user", "name");

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};



//@desc     Create a review
//@route    POST /api/v1/reviews
//@access   Private
exports.createReview = async (req, res) => {
    try {
      const { hotelId, rating, comment, images } = req.body;
      const userId = req.user.id;
  
      // Check if user has a booking at this hotel
      const booking = await Booking.findOne({
        user: userId,
        hotel: hotelId,
      }).sort({ checkOutDate: -1 }); // Get the latest booking
  
      if (!booking) {
        return res.status(403).json({ message: "You must book this hotel to leave a review." });
      }
  
      // Ensure today is AFTER check-out date
      const today = Date.now;
      const checkOutDate = new Date(booking.checkOutDate);
      if (today <= checkOutDate) {
        return res.status(403).json({ today: today, message: "You can only review after check-out." });
      }
  
      // Check if review already exists for the user and hotel
      const existingReview = await Review.findOne({ user: userId, hotel: hotelId });
      if (existingReview) {
        return res.status(403).json({ message: "You have already reviewed this hotel." });
      }
  
      // Create a new review
      const review = new Review({ user: userId, hotel: hotelId, rating, comment, images });
      await review.save();
  
      res.status(201).json({ success: true, data: review });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

//@desc     Update a review
//@route    PUT /api/v1/reviews/:id
//@access   Private
exports.updateReview = async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { rating, comment, images } = req.body;
      const userId = req.user.id;
  
      // Find the review by ID and make sure it's the user's review
      const review = await Review.findOne({ _id: reviewId, user: userId });
      if (!review) {
        return res.status(404).json({ message: "Review not found or not authorized to edit." });
      }
  
      // Update review details
      review.rating = rating ?? review.rating;
      review.comment = comment ?? review.comment;
      review.images = images ?? review.images;
  
      await review.save();
  
      res.json({ success: true, data: review });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

//@desc     Delete a review
//@route    DELETE /api/v1/reviews/:id
//@access   Private
exports.deleteReview = async (req, res) => {
    try{
        const { reviewId } = req.params;
        const userId = req.user.id;

        // Find the review by ID and make sure it's the user's review
        const review = await Review.findOne({ _id: reviewId, user: userId });
    if (!review) {
      return res.status(404).json({ message: "Review not found or not authorized to delete." });
    }

    // Delete the review
    await review.deleteOne();

    res.json({ success: true, message: "Review deleted successfully." });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//@desc     Vote on a review
//@route    POST /api/v1/reviews/:id/vote
//@access   Private
exports.voteReview = async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { voteType } = req.body; // "like" or "dislike"
      const userId = req.user.id;
  
      const review = await Review.findById(reviewId);
      if (!review) return res.status(404).json({ message: "Review not found" });
  
      if (voteType === "like") {
        review.likes.addToSet(userId);
        review.dislikes.pull(userId);
      } else if (voteType === "dislike") {
        review.dislikes.addToSet(userId);
        review.likes.pull(userId);
      }
  
      await review.save();
      res.json({ success: true, data: review });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

//@desc     Change vote on a review
//@route    PUT /api/v1/reviews/:id/vote
//@access   Private
exports.changeVoteReview = async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { voteType } = req.body; // "like" or "dislike"
      const userId = req.user.id;
  
      const review = await Review.findById(reviewId);
      if (!review) return res.status(404).json({ message: "Review not found" });
  
      if (voteType === "like") {
        review.likes.addToSet(userId);
        review.dislikes.pull(userId);
      } else if (voteType === "dislike") {
        review.dislikes.addToSet(userId);
        review.likes.pull(userId);
      }
  
      await review.save();
      res.json({ success: true, data: review });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };