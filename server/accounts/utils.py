# accounts/utils.py — Shared utility functions for TutorLink backend.
#
# Contains the Haversine formula calculation for computing great-circle
# distances between two latitude/longitude pairs on Earth in kilometers.

import math


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculates the great-circle distance between two points on the Earth (lat/lng) in kilometers.

    HAVERSINE FORMULA EXPLANATION FOR VIVA:
    --------------------------------------
    1. The Earth is spherical, so flat 2D distance formulas (like Pythagorean theorem) produce incorrect distances over spherical coordinates.
    2. Haversine converts latitude and longitude from degrees to radians.
    3. It calculates the angular difference in latitude (dlat = lat2 - lat1) and longitude (dlon = lon2 - lon1).
    4. Using spherical trigonometry (sine and cosine of latitudes), it computes the square of half the chord length ('a').
    5. The angular distance in radians 'c' is 2 * atan2(sqrt(a), sqrt(1-a)).
    6. Multiplying 'c' by the Earth's mean radius (R = 6371.0 km) produces the true distance in kilometers.

    Returns:
        float: Distance in kilometers rounded to 1 decimal place (e.g. 6.2), or None if coordinates are missing.
    """
    if None in (lat1, lon1, lat2, lon2):
        return None

    try:
        lat1, lon1, lat2, lon2 = map(float, [lat1, lon1, lat2, lon2])
    except (TypeError, ValueError):
        return None

    # Earth's mean radius in kilometers
    R = 6371.0

    # Convert degrees to radians
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    # Haversine formula computation
    a = (
        math.sin(dphi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance = R * c

    return round(distance, 1)


# Approximate coordinates for major Bangladeshi districts and Dhaka areas for distance fallback
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


def get_district_coordinates(location_str):
    """
    Extracts approximate latitude and longitude coordinates from a Bangladeshi location string.
    Returns (lat, lng) tuple or None if no match found.
    """
    if not location_str or not isinstance(location_str, str):
        return None

    cleaned = location_str.lower().strip()
    for key, coords in DISTRICT_COORDINATES.items():
        if key in cleaned:
            return coords

    return None
