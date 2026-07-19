import { readingTime, readingTimeMinutes } from "@/utils/reading-time";

describe("readingTime", () => {
  it("returns zero minutes for empty content", () => {
    const result = readingTime("");
    expect(result.words).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.text).toBe("Quick read");
  });

  it("strips HTML before counting words", () => {
    const html = "<p>One two <strong>three</strong> four</p>";
    const result = readingTime(html);
    expect(result.words).toBe(4);
    expect(result.minutes).toBe(1);
    expect(result.text).toBe("1 min read");
  });

  it("ceil-divides by words-per-minute (default 230)", () => {
    const words = Array.from({ length: 231 }, (_, i) => `w${i}`).join(" ");
    const result = readingTime(words);
    expect(result.words).toBe(231);
    expect(result.minutes).toBe(2);
    expect(result.text).toBe("2 min read");
  });

  it("respects a custom words-per-minute rate", () => {
    const words = "alpha beta gamma delta";
    const result = readingTime(words, 2);
    expect(result.words).toBe(4);
    expect(result.minutes).toBe(2);
  });

  it("readingTimeMinutes returns only the minute count", () => {
    expect(readingTimeMinutes("")).toBe(0);
    expect(readingTimeMinutes("<p>hello world</p>")).toBe(1);
  });
});
