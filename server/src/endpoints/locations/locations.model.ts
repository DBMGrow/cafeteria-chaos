import { db } from "@/lib/database"
import { DB } from "@/lib/db"
import { InsertResult, Selectable } from "kysely"
import { v4 as uuid } from "uuid"
import { Location } from "./locations.schemas"
import CodedError from "@/lib/CodedError"

export class Locations {
  async createLocation(location: Location): Promise<InsertResult> {
    const api_key = uuid()
    const newLocation = { ...location, api_key }

    // Check if location already exists
    const locationsExist = await this.getLocationByGooglePlaceId(newLocation.google_place_id)

    if (locationsExist) {
      throw new CodedError("Location already exists", 400, "LOC|06")
    }

    return await db
      .insertInto("Locations")
      .values(newLocation)
      .executeTakeFirst()
  }

  async getLocationById(location_id: number): Promise<Selectable<DB["Locations"]> | undefined> {
    const location = await db
      .selectFrom("Locations")
      .where("location_id", "=", location_id)
      .selectAll()
      .executeTakeFirst()

    return location
  }

  async getLocationByGooglePlaceId(google_place_id: string): Promise<Selectable<DB["Locations"]> | undefined> {

    const location = await db
      .selectFrom("Locations")
      .where("google_place_id", "=", google_place_id)
      .selectAll()
      .executeTakeFirst()

    return location
  }

}
