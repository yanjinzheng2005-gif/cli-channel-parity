import { Redactor } from "../dist/library.js";

const environment = Object.fromEntries(Object.entries(process.env).filter((entry) => typeof entry[1] === "string"));
const redactor = new Redactor([], [environment]);
const sentence = "Name of the environment variable containing the token to send";
if (redactor.text(sentence) !== sentence) throw new Error("Automatic environment redaction is hiding ordinary documentation words");
console.log("Environment redaction false-positive check: PASS");
