// Mordsteam Friends 002 – English version ("Four Minutes Dark"). Built from the same source as the German case (make("en")).
import { make } from "./friends-002.js";
export { ID, LIMIT_MIN, limitOf, MIN_PLAYERS, MAX_PLAYERS, VERHOER_MAX, VERHOER_FROM_STAGE, HINT_PENALTY, WRONG_PENALTY, QUIRK_KEYS, CLOCK_START, setup, groupData, roundOf, doubleSystem, doubleFallback } from "./friends-002.js";
const EN = make("en");
export const { TITLE, CLOCK_LABEL, LATE_LABEL, PLACE, STAGE_TITLES, QUIRKS, awardOf, questions, solution, hints, docs, resolution, MOT, MOT_SHORT, ST, hutName } = EN;
export const briefing = (N, G = {}) => EN.briefing(N, G);
