// Mordsteam Special 002 – “Four Minutes Dark” (English version, British English; Kerzenthal stays Austrian).
// Same culprits, variants, solutions, ids and HTML structure as special-002.js – both languages are built by make() there.
// The server merges { ...DE, ...EN } for English runs; round logic comes from the DE module.
import { make } from "./special-002.js";
const EN = make("en");
export const { TITLE, UI, SUSPECTS, QUESTIONS, solution, HINTS, briefing, docs, resolution, NAMES } = EN;
