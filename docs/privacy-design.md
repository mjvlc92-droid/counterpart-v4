# Privacy by Design — Counterpart

## The Question We Left Open

On May 9, 2026, Counterpart was presented at the AI Tinkerers Hackathon in Santiago. Three minutes into the Q&A, the organizer asked: *"Does this comply with Chile's personal data protection law?"*

Five seconds of silence. Then: "That's the right question."

That question changed the design. This document explains the technical answer — and the harder philosophical question we haven't resolved.

---

## What Counterpart Does Not Process

The system is built to be blind to identity:

- **No names** — the form has no name field
- **No emails** — not collected, not stored
- **No LinkedIn profiles** — no scraping, no API access
- **No biographic data** — no location, age, employer, or social identifiers
- **No conversation recordings** — the sparring session is not stored

---

## What Counterpart Does Process

The input is a structured description of **observable behavioral signals**:

- Communication style (pace, directness, response latency)
- Decision pattern (data-driven vs. relationship-driven)
- Pressure behavior (how they react when the deal is at risk)
- Non-verbal signals observed in prior meetings

These are behaviors the user already observed. Counterpart organizes them into a framework.

---

## The Technical Argument: Zero-PII Architecture

Under **Ley 21.719** (Chile's Data Protection Law, effective 2026), Article 2(f) defines "personal data" as any information relating to an *identified or identifiable* natural person.

The system does not know who you're describing. It receives a behavioral description with no identifier. The output — an archetype classification — is not linked to any person in the system's state.

**The classification exists only in the user's session. It is not stored, indexed, or cross-referenced.**

This is the same architectural principle used in differential privacy: the system is designed so that even with full access to the system's data, no individual is identifiable.

---

## The Harder Question

The technical argument holds. The harder question is whether it's sufficient.

**Identifiability may live in the user's mind, not in the system.**

If you describe the behavioral patterns of a specific person — a counterpart you know — and the system produces a profile, you can map that profile back to the person. The system doesn't know who they are. You do.

This raises two questions we've put to the public:

1. Does processing behavioral signals of an identifiable person (even without their identifier in the system) constitute "data processing" under Art. 2(f) of Ley 21.719?

2. If the user holds the identifier and the system holds the behavioral profile — how is responsibility distributed between user and system?

We don't have definitive answers. We think the Chilean legal and tech ecosystem needs this conversation before tools like Counterpart scale.

---

## Design Decisions Made in Response

Because identifiability lives in the user's context, not only the system's data, we made three design decisions:

**1. The form asks only for behavioral signals, never identity.** This is not a technical limitation — it's a deliberate constraint that makes the system architecturally privacy-respecting even when the user knows who they're describing.

**2. No storage of session data.** The archetype classification is computed in-memory and not persisted. There is no "history of people you've profiled."

**3. The methodology is open.** Publishing the frameworks (DISC, OCEAN, Voss, MICE) and the archetype definitions means users understand exactly what the system infers and why — not a black box making claims about people.

---

## Compliance References

| Standard | Status | Notes |
|---|---|---|
| Ley 21.719 (Chile) | Architecturally compliant | No personal data processed at system level |
| GDPR Art. 4(1) | Architecturally compliant | No identified/identifiable natural person in system state |
| CCPA | Architecturally compliant | No personal information collected |

---

## The Open Debate

We published the original question on LinkedIn and left it open. The thread is here:
[linkedin.com/feed/update/urn:li:activity:7459626732279463936/](https://www.linkedin.com/feed/update/urn:li:activity:7459626732279463936/)

If you have a position on the legal question — especially from a Chilean law perspective — we want to hear it.

---

*Counterpart · Privacy Design Document · 2026*