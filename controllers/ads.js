const Hotel = require('../models/Hotel');

//@desc     Get all hotels
//@route    GET /api/v1/ads
//@access   Public
exports.randomBanners = async (req, res, next) => {
  try {
    const hotels = await Hotel.find();

    if (!hotels || hotels.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hotels found",
      });
    }

    const numberOfBanners = 5;
    let banners = [];

    for (let i = 0; i < numberOfBanners; i++) {

        let totalToken = 0;
        let accBuffer = [];
        for (let j = 0; j < hotels.length; j++) {
            if (banners.includes(hotels[j].name)) continue;

            totalToken += hotels[j].subscriptionRank;
            accBuffer.push({ name: hotels[j].name, token: totalToken });
        }

        const randomIndex = Math.floor(Math.random() * totalToken);
        for (let j = 0; j < accBuffer.length; j++) {
            if (accBuffer[j].token > randomIndex) {
                banners.push(accBuffer[j].name);
                break;
            }
        }
    }

    const hotelฺBanners = await Hotel.find({name: { $in: banners }}).select('name picture address tel');

    res.status(200).json({
      success: true,
      data: hotelฺBanners,
    });

  } catch (err) {
    console.error("Error in randomHotel:", err);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};