import { describe, expect, it } from "vitest";

import { buildRollupBriefing, type BriefingData } from "@/lib/briefing";
import { findLastShiftWindow, previousShift, shiftForHour } from "@/lib/shift";

function data(overrides: Partial<BriefingData> = {}): BriefingData {
  return {
    locationName: "Cedar Street Shelter",
    shift: "overnight",
    windowStart: new Date("2026-02-01T07:00:00Z"),
    windowEnd: new Date("2026-02-01T15:00:00Z"),
    logEntries: [],
    openTickets: [],
    lowStockItems: [],
    pendingFollowUps: [],
    occupancy: null,
    ...overrides,
  };
}

describe("rollup briefing (no LLM key)", () => {
  it("says so plainly when there is nothing to hand off", () => {
    const briefing = buildRollupBriefing(data());

    expect(briefing.source).toBe("rollup");
    expect(briefing.headline).toContain("Cedar Street Shelter");
    expect(briefing.bullets).toHaveLength(1);
    expect(briefing.bullets[0]).toContain("Nothing was flagged");
  });

  it("leads with bed numbers when a count exists", () => {
    const briefing = buildRollupBriefing(
      data({
        occupancy: {
          bedsOccupied: 41,
          bedsOffline: 2,
          bedCapacity: 48,
          recordedAt: new Date("2026-02-01T13:00:00Z"),
        },
      }),
    );

    expect(briefing.bullets[0]).toContain("41 of 48 occupied");
    expect(briefing.bullets[0]).toContain("5 available");
    expect(briefing.bullets[0]).toContain("2 offline");
  });

  it("puts urgent notes before ones that only need attention", () => {
    const briefing = buildRollupBriefing(
      data({
        logEntries: [
          {
            category: "general",
            severity: "attention",
            body: "Argument in the dayroom, de-escalated",
            authorName: "Priya Nakamura",
            occurredAt: new Date(),
          },
          {
            category: "maintenance",
            severity: "urgent",
            body: "Heater in Dorm B grinding",
            authorName: "Jamie Rivera",
            occurredAt: new Date(),
          },
          {
            category: "handoff",
            severity: "info",
            body: "Three late arrivals",
            authorName: "Jamie Rivera",
            occurredAt: new Date(),
          },
        ],
      }),
    );

    expect(briefing.bullets[0]).toContain("Urgent");
    expect(briefing.bullets[0]).toContain("Heater in Dorm B");
    expect(briefing.bullets[1]).toContain("Needs attention");
    expect(briefing.headline).toContain("3 log notes");
    expect(briefing.headline).toContain("2 flagged");
  });

  it("surfaces high and urgent tickets and low stock, and ignores low priority noise", () => {
    const briefing = buildRollupBriefing(
      data({
        openTickets: [
          { title: "Playroom light flickering", priority: "low", status: "open", area: null },
          { title: "Heater grinding", priority: "urgent", status: "in_progress", area: "Dorm B" },
        ],
        lowStockItems: [
          { name: "Body wash", quantity: 2, unit: "case", lowStockThreshold: 4 },
        ],
        pendingFollowUps: [{ subject: "Bed 14 — state ID", urgency: "soon" }],
      }),
    );

    const text = briefing.bullets.join("\n");
    expect(text).toContain("Heater grinding (Dorm B)");
    expect(text).not.toContain("Playroom light");
    expect(text).toContain("Body wash (2 case)");
    expect(text).toContain("Bed 14 — state ID");
  });
});

describe("shift boundaries", () => {
  it("maps hours to the shift that covers them", () => {
    expect(shiftForHour(7)).toBe("day");
    expect(shiftForHour(14)).toBe("day");
    expect(shiftForHour(15)).toBe("swing");
    expect(shiftForHour(22)).toBe("swing");
    expect(shiftForHour(23)).toBe("overnight");
    expect(shiftForHour(3)).toBe("overnight");
  });

  it("knows which shift just ended", () => {
    expect(previousShift("day")).toBe("overnight");
    expect(previousShift("swing")).toBe("day");
    expect(previousShift("overnight")).toBe("swing");
  });

  it("finds the most recent window for a shift in the site's timezone", () => {
    // 2026-02-01T18:30Z is 10:30 in Los Angeles, i.e. the day shift.
    const now = new Date("2026-02-01T18:30:00Z");
    const window = findLastShiftWindow("overnight", "America/Los_Angeles", now);

    // The overnight shift that just ended ran 23:00 the previous evening to
    // 06:59 local, which is 07:00Z to 15:00Z on 2026-02-01.
    expect(window.start.toISOString()).toBe("2026-02-01T07:00:00.000Z");
    expect(window.end.getTime()).toBeLessThan(
      new Date("2026-02-01T15:00:00.000Z").getTime(),
    );
    expect(window.end.getTime()).toBeGreaterThan(window.start.getTime());
  });

  it("returns a window inside the current shift when asked for it", () => {
    const now = new Date("2026-02-01T18:30:00Z");
    const window = findLastShiftWindow("day", "America/Los_Angeles", now);

    expect(window.end.getTime()).toBe(now.getTime());
    expect(window.start.toISOString()).toBe("2026-02-01T15:00:00.000Z");
  });
});
