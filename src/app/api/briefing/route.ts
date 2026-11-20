import { getBriefingData } from "@/db/queries/briefing";
import { requirePermission } from "@/lib/actor";
import { generateBriefing } from "@/lib/briefing";
import { jsonError } from "@/lib/http";
import { assertLocationAccess } from "@/lib/permissions";
import { currentShift } from "@/lib/shift";

/** On-demand shift briefing for one site. */
export async function GET(request: Request) {
  try {
    const context = await requirePermission("briefing:generate");

    const requested = new URL(request.url).searchParams.get("locationId");
    const locationId = requested ?? context.actor.primaryLocationId;
    assertLocationAccess(context.actor, locationId);

    const location = context.locations.find((item) => item.id === locationId);
    if (!location) {
      return Response.json({ error: "Unknown site." }, { status: 400 });
    }

    const data = await getBriefingData(
      location,
      context.organization.timezone,
      currentShift(context.organization.timezone),
    );

    const briefing = await generateBriefing(data);

    return Response.json({
      locationName: location.name,
      shift: data.shift,
      windowStart: data.windowStart.toISOString(),
      windowEnd: data.windowEnd.toISOString(),
      briefing,
    });
  } catch (error) {
    return jsonError(error);
  }
}
