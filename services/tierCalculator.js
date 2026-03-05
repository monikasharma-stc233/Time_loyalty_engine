function calculateTier(spend) {
  if (spend > 10000) return "Gold";
  if (spend >= 5000) return "Silver";
  return "Bronze";
}

module.exports = calculateTier;