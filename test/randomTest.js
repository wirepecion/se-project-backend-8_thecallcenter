const axios = require('axios');

const URL = 'http://localhost:5000/api/v1/ads';

const hotelRanks = {
  "Blue Horizon Inn": 5,
  "The Urban Mirage": 5,
  "The Cloudveil": 4,
  "Wanderlight Hotel": 4,
  "Golden Hour Resort": 4,
  "Luxe Haven": 3,
  "The Monarch Club": 3,
  "The Azure Key": 3,
  "Echo Heights": 3,
  "Silverleaf Retreat": 2,
  "The Pine & Palm": 2,
  "Sapphire Ridge": 2,
  "Oceancrest Suites": 2,
  "Starlight Inn": 2,
  "The Driftwood Lodge": 1,
  "Harborline Suites": 1,
  "The Willow Gate": 1,
  "Velvet Peak": 1,
  "Citrine Springs": 1,
  "Stonebridge Hotel": 1,
  "Cascade Point Hotel": 0,
  "The Ember Nest": 0,
  "Sundown & Co.": 0,
  "Nova Terrace": 0,
  "Moonbay Residences": 0
};  

async function collectData(times = 1000) {
  const requests = Array.from({ length: times }, () => axios.get(URL));

  try {
    const responses = await Promise.all(requests);
    
    // Extract and flatten all `data` arrays from responses
    const allData = responses.flatMap(res => res.data.data);

    // Count frequency
    const frequency = {};
    for (const item of allData) {
      frequency[item] = (frequency[item] || 0) + 1;
    }

    // Sort frequencies
    const sorted = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1]); // Descending order

    // Log results
    console.log('Total strings collected:', allData.length);
    console.log('Frequencies (sorted):');
    console.table(
      sorted.map(([key, value]) => ({ name: key, count: Math.round((value/allData.length) * 10000) / 100, rank: hotelRanks[key] }))
    );

  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

collectData();
