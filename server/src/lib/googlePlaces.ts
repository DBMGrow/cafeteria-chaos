/**
 * Google Places API utilities
 */

/**
 * Validates a Google Place ID by fetching place details from the Google Places API
 * @param placeId - The Google Place ID to validate
 * @returns Place details object if valid, false if invalid
 */
export async function validatePlaceId(placeId: string): Promise<boolean | any> {
  if (!placeId) return false

  try {
    const resp = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-FieldMask": "*",
        "X-Goog-Api-Key": process.env.MAPS_API_KEY || "",
      },
    })

    const body = await resp.json()

    if (!resp.ok) return false
    return body
  } catch (e) {
    return false
  }
}
