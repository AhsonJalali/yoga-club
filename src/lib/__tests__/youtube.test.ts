import { describe, it, expect } from "vitest";
import { youtubeId, youtubeEmbedUrl, youtubeThumb } from "../youtube";

describe("youtubeId", () => {
  it("extracts the id from a standard watch URL", () => {
    expect(youtubeId("https://www.youtube.com/watch?v=abc123XYZ_-")).toBe("abc123XYZ_-");
  });

  it("extracts the id from a youtu.be short link", () => {
    expect(youtubeId("https://youtu.be/abc123XYZ_-")).toBe("abc123XYZ_-");
  });

  it("extracts the id from a youtu.be link with a query string", () => {
    expect(youtubeId("https://youtu.be/abc123XYZ_-?t=30")).toBe("abc123XYZ_-");
  });

  it("extracts the id from an /embed/ URL", () => {
    expect(youtubeId("https://www.youtube.com/embed/abc123XYZ_-")).toBe("abc123XYZ_-");
  });

  it("extracts the id from a /shorts/ URL", () => {
    expect(youtubeId("https://www.youtube.com/shorts/abc123XYZ_-")).toBe("abc123XYZ_-");
  });

  it("extracts the id from a mobile (m.youtube.com) URL", () => {
    expect(youtubeId("https://m.youtube.com/watch?v=mobileId123")).toBe("mobileId123");
  });

  it("ignores extra query params like list/index on a watch URL", () => {
    expect(youtubeId("https://www.youtube.com/watch?v=abc123&list=PL123&index=2")).toBe("abc123");
  });

  it("returns null for a bare youtu.be link with no id", () => {
    expect(youtubeId("https://youtu.be/")).toBeNull();
  });

  it("returns null for a bare youtube.com homepage link", () => {
    expect(youtubeId("https://www.youtube.com/")).toBeNull();
  });

  it("returns null for a non-YouTube URL", () => {
    expect(youtubeId("https://example.com/video")).toBeNull();
  });

  it("returns null for a string that isn't a valid URL", () => {
    expect(youtubeId("not a url")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(youtubeId("")).toBeNull();
  });
});

describe("youtubeEmbedUrl", () => {
  it("builds a privacy-conscious embed URL for a valid video URL", () => {
    expect(youtubeEmbedUrl("https://www.youtube.com/watch?v=abc123")).toBe(
      "https://www.youtube.com/embed/abc123?rel=0&modestbranding=1"
    );
  });

  it("returns null when the id can't be parsed", () => {
    expect(youtubeEmbedUrl("https://example.com/video")).toBeNull();
  });
});

describe("youtubeThumb", () => {
  it("builds an i.ytimg.com thumbnail URL for a valid video URL", () => {
    expect(youtubeThumb("https://youtu.be/abc123")).toBe("https://i.ytimg.com/vi/abc123/hqdefault.jpg");
  });

  it("returns null when the id can't be parsed", () => {
    expect(youtubeThumb("not a url")).toBeNull();
  });
});
