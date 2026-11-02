const request = require("supertest");
const app = require("../server");
const axios = require("axios");

// Mock Axios so it doesn't make real external network calls to LIRR during tests
jest.mock("axios");

describe("LIRR Backend Proxy API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/scratch-sheet returns data successfully", async () => {
    // Mock the expected response from LIRR's internal endpoint
    const mockLirrData = {
      status: "OK",
      data: [{ id: 1, name: "Sample Crew Record" }],
    };
    axios.get.mockResolvedValueOnce({ data: mockLirrData });

    const response = await request(app)
      .get("/api/scratch-sheet")
      .query({ date: "11/02/2026", craftGroup: "TS" });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(mockLirrData);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  test("GET /api/scratch-sheet handles upstream errors gracefully", async () => {
    // Mock an error from the LIRR service
    axios.get.mockRejectedValueOnce(new Error("Network failure"));

    const response = await request(app).get("/api/scratch-sheet");

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      error: "Failed to fetch scratch sheet from LIRR",
    });
  });
});
