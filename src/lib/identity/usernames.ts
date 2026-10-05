// src/lib/identity/usernames.ts
// Random funny usernames, e.g. "SleepyRickshaw_17". Not linked to any real identity.

import { randomInt } from "node:crypto";

const ADJECTIVES = [
  "Sleepy", "Grumpy", "Dancing", "Spicy", "Chatty", "Sneaky", "Jolly", "Breezy",
  "Curious", "Fuzzy", "Hasty", "Lazy", "Mighty", "Noisy", "Peppy", "Quirky",
  "Rusty", "Shy", "Sassy", "Tangy", "Thrifty", "Wobbly", "Zesty", "Bouncy",
  "Cheeky", "Dizzy", "Fearless", "Giggly", "Humble", "Jumpy", "Lucky", "Moody",
  "Nimble", "Plucky", "Restless", "Salty", "Sunny", "Tipsy", "Witty", "Yawning",
  "Crispy", "Frugal", "Sparky", "Snoozy", "Clever", "Brave", "Calm", "Stubborn",
];

const NOUNS = [
  "Rickshaw", "Samosa", "Mango", "Peacock", "Jalebi", "Pakora", "Tiffin", "Coconut",
  "Mongoose", "Monsoon", "Dosa", "Idli", "Chutney", "Lassi", "Tabla", "Kite",
  "Banyan", "Parrot", "Elephant", "Tiger", "Kulfi", "Ladoo", "Biscuit", "Scooter",
  "Cooker", "Vada", "Paratha", "Rasgulla", "Chikki", "Bhelpuri", "Lotus", "Camel",
  "Cobra", "Squirrel", "Myna", "Buffalo", "Tamarind", "Jackfruit", "Guava", "Papad",
  "Pickle", "Umbrella", "Lantern", "Kettle", "Sparrow", "Peanut", "Cricket", "Kabaddi",
];

export function randomUsername(): string {
  const adjective = ADJECTIVES[randomInt(ADJECTIVES.length)];
  const noun = NOUNS[randomInt(NOUNS.length)];
  return `${adjective}${noun}_${randomInt(10, 100)}`;
}

export function isValidUsername(name: string): boolean {
  return /^[A-Z][a-z]+[A-Z][a-z]+_\d{2}$/.test(name);
}
