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
    // Using OLD Places API - Place Details endpoint
    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json")
    url.searchParams.append("place_id", placeId)
    url.searchParams.append("key", process.env.MAPS_API_KEY || "")
    url.searchParams.append("fields", "place_id,formatted_address,name,types")

    const resp = await fetch(url.toString(), {
      method: "GET",
    })

    const body = await resp.json()

    // Check if the request was successful
    if (!resp.ok || body.status !== "OK") return false

    return {
      id: body.result.place_id,
      formattedAddress: body.result.formatted_address,
      displayName: {
        text: body.result.name
      },
      types: body.result.types
    }
  } catch (e) {
    return false
  }
}

/**
 * NEW API VERSION - Validates using Places API (New)
 * Requires "Places API (New)" to be enabled in Google Cloud Console
 * Only use this if you need features from the new API
 */
export async function validatePlaceIdNew(placeId: string): Promise<boolean | any> {
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