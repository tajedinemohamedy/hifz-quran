/* The running practice session (quiz or mutashabihat round), started from any screen. */
import { createStore } from "./store";
import type { Scope, QuizMode } from "./quiz";
import type { Occurrence } from "./mut";

export type Run = { quiz: Scope; mode: QuizMode } | { mut: Occurrence[] };

export const practice = createStore({ run: null as Run | null, id: 0 });

export const startPractice = (run: Run) => { if (!("mut" in run) || run.mut.length) practice.set((s) => ({ run, id: s.id + 1 })); };
export const endPractice = () => practice.set({ run: null });
