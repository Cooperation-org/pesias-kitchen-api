/**
 * Geolocation utilities for location verification
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point  
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c * 1000; // Return distance in meters
}

/**
 * Convert degrees to radians
 * @param {number} degrees 
 * @returns {number} Radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Validate if coordinates are within valid ranges
 * @param {number} latitude - Latitude (-90 to 90)
 * @param {number} longitude - Longitude (-180 to 180)
 * @returns {boolean} True if valid
 */
function isValidCoordinates(latitude, longitude) {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180
  );
}

/**
 * Check if user location is within acceptable range of event location
 * @param {Object} userLocation - User's location data
 * @param {Object} eventLocation - Event's location data
 * @param {number} maxDistanceMeters - Maximum allowed distance in meters
 * @returns {Object} Validation result
 */
function validateEventLocation(userLocation, eventLocation, maxDistanceMeters = 500) {
  if (!userLocation || !eventLocation) {
    return {
      valid: false,
      error: 'Missing location data',
      distance: null
    };
  }

  if (!isValidCoordinates(userLocation.latitude, userLocation.longitude)) {
    return {
      valid: false,
      error: 'Invalid user coordinates',
      distance: null
    };
  }

  if (!isValidCoordinates(eventLocation.latitude, eventLocation.longitude)) {
    return {
      valid: false,
      error: 'Invalid event coordinates',
      distance: null
    };
  }

  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    eventLocation.latitude,
    eventLocation.longitude
  );

  return {
    valid: distance <= maxDistanceMeters,
    distance: Math.round(distance),
    maxAllowed: maxDistanceMeters,
    error: distance > maxDistanceMeters ? 
      `Too far from event location (${Math.round(distance)}m > ${maxDistanceMeters}m)` : 
      null
  };
}

/**
 * Get location accuracy description
 * @param {number} accuracy - GPS accuracy in meters
 * @returns {string} Human-readable accuracy description
 */
function getAccuracyDescription(accuracy) {
  if (!accuracy) return 'Unknown';
  if (accuracy <= 10) return 'Very High';
  if (accuracy <= 50) return 'High';
  if (accuracy <= 100) return 'Medium';
  if (accuracy <= 500) return 'Low';
  return 'Very Low';
}

/**
 * Format coordinates for display
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} precision - Decimal places (default: 6)
 * @returns {string} Formatted coordinates
 */
function formatCoordinates(lat, lng, precision = 6) {
  if (!isValidCoordinates(lat, lng)) return 'Invalid coordinates';
  
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

/**
 * Calculate bounding box around a point
 * @param {number} latitude - Center latitude
 * @param {number} longitude - Center longitude
 * @param {number} radiusMeters - Radius in meters
 * @returns {Object} Bounding box with min/max lat/lng
 */
function getBoundingBox(latitude, longitude, radiusMeters) {
  if (!isValidCoordinates(latitude, longitude)) {
    throw new Error('Invalid coordinates');
  }

  const radiusKm = radiusMeters / 1000;
  const earthRadiusKm = 6371;
  
  const deltaLat = (radiusKm / earthRadiusKm) * (180 / Math.PI);
  const deltaLng = (radiusKm / earthRadiusKm) * (180 / Math.PI) / Math.cos(latitude * Math.PI / 180);

  return {
    minLat: latitude - deltaLat,
    maxLat: latitude + deltaLat,
    minLng: longitude - deltaLng,
    maxLng: longitude + deltaLng
  };
}

/**
 * Check if a point is within a bounding box
 * @param {number} lat - Point latitude
 * @param {number} lng - Point longitude
 * @param {Object} bbox - Bounding box from getBoundingBox()
 * @returns {boolean} True if point is inside bounding box
 */
function isPointInBoundingBox(lat, lng, bbox) {
  return (
    lat >= bbox.minLat && lat <= bbox.maxLat &&
    lng >= bbox.minLng && lng <= bbox.maxLng
  );
}

module.exports = {
  calculateDistance,
  toRadians,
  isValidCoordinates,
  validateEventLocation,
  getAccuracyDescription,
  formatCoordinates,
  getBoundingBox,
  isPointInBoundingBox
};