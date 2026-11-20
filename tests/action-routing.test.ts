import { describe, expect, it } from "vitest";

import { classifyWithKeywords, extractArea } from "@/lib/action/keyword-classifier";
import { parseProposals } from "@/lib/action/llm";
import {
  PROPOSAL_PERMISSION,
  actionProposalSchema,
  proposalHeadline,
  type ActionProposal,
  type ActionProposalKind,
  type ClassifierContext,
} from "@/lib/action/types";
import { hasPermission, type Actor } from "@/lib/permissions";

const context: ClassifierContext = {
  locationName: "Cedar Street Shelter",
  shift: "overnight",
  knownItems: [
    { name: "Body wash", unit: "case", quantity: 6 },
    { name: "Socks", unit: "pair", quantity: 25 },
    { name: "Bus passes", unit: "each", quantity: 31 },
  ],
};

function classify(text: string) {
  return classifyWithKeywords(text, context);
}

function kinds(proposals: readonly ActionProposal[]): ActionProposalKind[] {
  return proposals.map((proposal) => proposal.kind);
}

function find<K extends ActionProposalKind>(
  proposals: readonly ActionProposal[],
  kind: K,
): Extract<ActionProposal, { kind: K }> {
  const match = proposals.find((proposal) => proposal.kind === kind);
  if (!match) throw new Error(`No ${kind} proposal was produced`);
  return match as Extract<ActionProposal, { kind: K }>;
}

describe("keyword classifier: maintenance", () => {
  it("routes a broken heater to a ticket plus a log note", () => {
    const result = classify("Heater broken in Dorm B");

    expect(result.classifier).toBe("keyword");
    expect(kinds(result.proposals)).toEqual([
      "maintenance_ticket",
      "shift_log_note",
    ]);

    const ticket = find(result.proposals, "maintenance_ticket");
    expect(ticket.area).toBe("Dorm B");
    expect(ticket.title.toLowerCase()).toContain("heater");
    expect(ticket.priority).toBe("high");
  });

  it("escalates a safety hazard to urgent", () => {
    const ticket = find(
      classify("There's no heat in the women's dorm and it's freezing").proposals,
      "maintenance_ticket",
    );
    expect(ticket.priority).toBe("urgent");
  });

  it("marks a cosmetic problem as low priority", () => {
    const ticket = find(
      classify("Minor thing, the playroom light is flickering, not urgent")
        .proposals,
      "maintenance_ticket",
    );
    expect(ticket.priority).toBe("low");
  });

  it("treats pests as maintenance even without a breakage word", () => {
    const result = classify("Found mice droppings in the pantry");
    expect(kinds(result.proposals)).toContain("maintenance_ticket");
    expect(find(result.proposals, "maintenance_ticket").area).toBe("Pantry");
  });

  it("does not open a ticket for an ordinary note", () => {
    const result = classify("Quiet night. Three late arrivals, all in by 1am.");
    expect(kinds(result.proposals)).toEqual(["shift_log_note"]);
    expect(find(result.proposals, "shift_log_note").category).toBe("general");
  });

  it("reads areas in several shapes", () => {
    expect(extractArea("heater in dorm b is out")).toBe("Dorm B");
    expect(extractArea("sink in room 12 is clogged")).toBe("Room 12");
    expect(extractArea("the kitchen freezer died")).toBe("Kitchen");
    expect(extractArea("something vague")).toBeUndefined();
  });
});

describe("keyword classifier: inventory", () => {
  it("reads 'down to 2 cases' as a new count, not a change", () => {
    const result = classify("We're down to 2 cases of body wash");
    const adjustment = find(result.proposals, "inventory_adjustment");

    expect(adjustment.itemName).toBe("Body wash");
    expect(adjustment.adjustmentType).toBe("set");
    expect(adjustment.amount).toBe(2);
  });

  it("reads 'used 6' as a negative change", () => {
    const adjustment = find(
      classify("Used 6 pairs of socks tonight").proposals,
      "inventory_adjustment",
    );

    expect(adjustment.itemName).toBe("Socks");
    expect(adjustment.adjustmentType).toBe("delta");
    expect(adjustment.amount).toBe(-6);
  });

  it("reads a restock as a positive change", () => {
    const adjustment = find(
      classify("Received 12 cases of body wash from the donation run").proposals,
      "inventory_adjustment",
    );

    expect(adjustment.adjustmentType).toBe("delta");
    expect(adjustment.amount).toBe(12);
  });

  it("reads 'ran out of' as zero", () => {
    const adjustment = find(
      classify("We ran out of bus passes").proposals,
      "inventory_adjustment",
    );

    expect(adjustment.itemName).toBe("Bus passes");
    expect(adjustment.adjustmentType).toBe("set");
    expect(adjustment.amount).toBe(0);
  });

  it("does not guess a count when none was given", () => {
    const result = classify("Running low on body wash, should reorder");
    expect(kinds(result.proposals)).toEqual(["shift_log_note"]);
    expect(find(result.proposals, "shift_log_note").category).toBe("general");
  });

  it("matches a known item case-insensitively and in the singular", () => {
    const adjustment = find(
      classify("handed out 3 bus pass today").proposals,
      "inventory_adjustment",
    );
    expect(adjustment.itemName).toBe("Bus passes");
  });
});

describe("keyword classifier: case manager follow-ups", () => {
  it("routes a case management request to a follow-up", () => {
    const result = classify(
      "Bed 14 asked to see a case manager about replacing their state ID",
    );

    expect(kinds(result.proposals)).toEqual([
      "case_manager_follow_up",
      "shift_log_note",
    ]);

    const followUp = find(result.proposals, "case_manager_follow_up");
    expect(followUp.subject).toContain("Bed 14");
    expect(followUp.urgency).toBe("routine");
    expect(find(result.proposals, "shift_log_note").category).toBe(
      "resident_support",
    );
  });

  it("raises urgency for same-day requests", () => {
    const followUp = find(
      classify("Room 3 needs to talk to a case manager today about benefits")
        .proposals,
      "case_manager_follow_up",
    );
    expect(followUp.urgency).toBe("soon");
  });

  it("raises urgency when there is a crisis word", () => {
    const followUp = find(
      classify("Bed 7 is in crisis and needs a case manager").proposals,
      "case_manager_follow_up",
    );
    expect(followUp.urgency).toBe("urgent");
  });
});

describe("keyword classifier: shift log note", () => {
  it("always produces exactly one note, last", () => {
    const inputs = [
      "Heater broken in Dorm B",
      "Down to 2 cases of body wash",
      "Bed 14 wants to talk to a case manager",
      "Nothing to report",
    ];

    for (const input of inputs) {
      const proposals = classify(input).proposals;
      const notes = proposals.filter(
        (proposal) => proposal.kind === "shift_log_note",
      );
      expect(notes).toHaveLength(1);
      expect(proposals[proposals.length - 1]?.kind).toBe("shift_log_note");
    }
  });

  it("categorizes an incident and flags it for attention", () => {
    const note = find(
      classify(
        "Verbal altercation in the dayroom at shift change, de-escalated, no police contact",
      ).proposals,
      "shift_log_note",
    );

    expect(note.category).toBe("incident");
    expect(note.severity).toBe("attention");
  });

  it("marks a hazard urgent", () => {
    const note = find(
      classify("Smells like gas near the kitchen").proposals,
      "shift_log_note",
    );
    expect(note.severity).toBe("urgent");
  });

  it("keeps the staff member's own words in the note body", () => {
    const text = "Dryer on the second floor is not heating up";
    expect(find(classify(text).proposals, "shift_log_note").body).toBe(text);
  });
});

describe("classification output", () => {
  it("produces proposals that pass the schema used at confirm time", () => {
    const inputs = [
      "Heater broken in Dorm B and we're down to 2 cases of body wash",
      "Bed 14 wants a case manager about an ID, also used 4 pairs of socks",
      "All quiet",
      "Toilet in room 12 is clogged and overflowing, urgent",
    ];

    for (const input of inputs) {
      for (const proposal of classify(input).proposals) {
        expect(actionProposalSchema.safeParse(proposal).success).toBe(true);
      }
    }
  });

  it("handles a multi-part observation in one pass", () => {
    const result = classify(
      "Heater in Dorm B is making a grinding noise and it's cold in there. Also we're down to 2 cases of body wash.",
    );

    expect(kinds(result.proposals)).toEqual([
      "maintenance_ticket",
      "inventory_adjustment",
      "shift_log_note",
    ]);
    expect(result.summary).toContain("3 actions");
  });

  it("writes a headline for each proposal kind", () => {
    const result = classify(
      "Heater broken in Dorm B, down to 2 cases of body wash, and bed 14 needs a case manager",
    );
    for (const proposal of result.proposals) {
      expect(proposalHeadline(proposal).length).toBeGreaterThan(0);
    }
  });
});

describe("permission routing for proposals", () => {
  function actor(overrides: Partial<Actor>): Actor {
    return {
      userId: "user_1",
      name: "Test",
      email: "test@example.org",
      role: "site_assistant",
      organizationId: "org_1",
      jobTitle: null,
      isActive: true,
      locationIds: ["site_a"],
      primaryLocationId: "site_a",
      ...overrides,
    };
  }

  it("maps every proposal kind to a permission", () => {
    const kindsCovered = Object.keys(PROPOSAL_PERMISSION) as ActionProposalKind[];
    expect(kindsCovered.sort()).toEqual(
      [
        "case_manager_follow_up",
        "inventory_adjustment",
        "maintenance_ticket",
        "shift_log_note",
      ].sort(),
    );
  });

  it("lets front-line staff save every kind the classifier produces", () => {
    const staff = actor({ role: "site_assistant" });
    for (const proposal of classify(
      "Heater broken in Dorm B, down to 2 cases of body wash, bed 14 needs a case manager",
    ).proposals) {
      expect(hasPermission(staff, PROPOSAL_PERMISSION[proposal.kind])).toBe(true);
    }
  });

  it("blocks a case manager from saving an inventory proposal", () => {
    const caseManager = actor({ role: "case_manager" });
    expect(
      hasPermission(caseManager, PROPOSAL_PERMISSION.inventory_adjustment),
    ).toBe(false);
    expect(
      hasPermission(caseManager, PROPOSAL_PERMISSION.maintenance_ticket),
    ).toBe(true);
    expect(hasPermission(caseManager, PROPOSAL_PERMISSION.shift_log_note)).toBe(
      true,
    );
  });
});

describe("LLM response parsing", () => {
  it("keeps valid proposals and drops malformed ones", () => {
    const parsed = parseProposals([
      {
        kind: "maintenance_ticket",
        title: "Heater grinding in Dorm B",
        priority: "urgent",
      },
      { kind: "maintenance_ticket", title: "no", priority: "urgent" },
      { kind: "not_a_kind", title: "Something" },
      {
        kind: "inventory_adjustment",
        itemName: "Body wash",
        adjustmentType: "set",
        amount: -3,
        reason: "bad data",
      },
      {
        kind: "shift_log_note",
        body: "Heater grinding in Dorm B",
        category: "maintenance",
        severity: "urgent",
      },
    ]);

    expect(kinds(parsed)).toEqual(["maintenance_ticket", "shift_log_note"]);
  });

  it("returns nothing for a non-array payload", () => {
    expect(parseProposals(undefined)).toEqual([]);
    expect(parseProposals({ kind: "shift_log_note" })).toEqual([]);
    expect(parseProposals("[]")).toEqual([]);
  });

  it("rejects a zero-delta inventory change", () => {
    expect(
      parseProposals([
        {
          kind: "inventory_adjustment",
          itemName: "Socks",
          adjustmentType: "delta",
          amount: 0,
          reason: "nothing happened",
        },
      ]),
    ).toEqual([]);
  });
});
