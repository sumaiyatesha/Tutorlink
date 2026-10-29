"""
TutorLink - Utility Functions (server/accounts/utils.py)

This module contains shared helper functions:
1. haversine_distance: Calculates real-world geographic distance (in kilometers)
   between two (latitude, longitude) coordinates.
2. get_district_coordinates: Looks up approximate coordinates for Bangladeshi districts
   and neighborhoods to enable location-based matching.
"""

import math

# Approximate GPS Coordinates for major Bangladeshi districts and Dhaka neighborhoods.
# Key: lowercase name, Value: (Latitude, Longitude)
DISTRICT_COORDINATES = {
    'dhaka': (23.8103, 90.4125),
    'uttara': (23.8759, 90.3795),
    'dhanmondi': (23.7461, 90.3742),
    'gulshan': (23.7925, 90.4167),
    'banani': (23.7937, 90.4043),
    'mirpur': (23.8223, 90.3654),
    'mohammadpur': (23.7658, 90.3583),
    'motijheel': (23.7330, 90.4172),
    'chittagong': (22.3569, 91.7832),
    'chattogram': (22.3569, 91.7832),
    'sylhet': (24.8949, 91.8687),
    'gazipur': (23.9999, 90.4203),
    'narayanganj': (23.6238, 90.5000),
    'khulna': (22.8456, 89.5403),
    'rajshahi': (24.3745, 88.6042),
    'barishal': (22.7010, 90.3535),
    'rangpur': (25.7439, 89.2752),
    'mymensingh': (24.7471, 90.4203),
    'cumilla': (23.4607, 91.1809),
    'comilla': (23.4607, 91.1809),
}


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great-circle distance between two GPS points on Earth in kilometers.

    Why Haversine?
    - The Earth is curved (spherical), so standard 2D Euclidean distance produces inaccurate results.
    - Haversine trigonometry accounts for the curvature of the Earth.

    Parameters:
        lat1 (float): Latitude of the starting location.
        lon1 (float): Longitude of the starting location.
        lat2 (float): Latitude of the destination location.
        lon2 (float): Longitude of the destination location.

    Returns:
        float: Distance in kilometers (rounded to 1 decimal place), or None if coordinates are invalid.
    """
    # Step 1: Ensure all four coordinates are provided
    if None in (lat1, lon1, lat2, lon2):
        return None

    # Step 2: Safely convert input values to floating point numbers
    try:
        lat1 = float(lat1)
        lon1 = float(lon1)
        lat2 = float(lat2)
        lon2 = float(lon2)
    except (TypeError, ValueError):
        return None

    # Step 3: Mean radius of Planet Earth in kilometers
    EARTH_RADIUS_KM = 6371.0

    # Step 4: Convert degree coordinates to radians for trigonometric calculation
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    # Step 5: Haversine mathematical formula
    # a is the square of half the chord length between the points
    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )

    # c is the angular distance in radians
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    # Step 6: Compute final distance in kilometers
    distance = EARTH_RADIUS_KM * c

    return round(distance, 1)


def get_district_coordinates(location_str):
    """
    Look up approximate GPS (latitude, longitude) coordinates for a given location text.

    Parameters:
        location_str (str): Address or city name text (e.g. 'Dhanmondi, Dhaka').

    Returns:
        tuple (float, float): (latitude, longitude) pair, or None if not found.
    """
    # Step 1: Check if a valid string is provided
    if not location_str or not isinstance(location_str, str):
        return None

    # Step 2: Normalize text to lowercase and strip extra whitespace
    cleaned = location_str.lower().strip()

    # Step 3: Check against known locations
    for district_name, coords in DISTRICT_COORDINATES.items():
        if district_name in cleaned:
            return coords

    return None