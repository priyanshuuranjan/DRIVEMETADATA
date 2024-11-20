const request = require("supertest");
const app = require("../server");
const redisClient = require("../redisClient");
const sendToKafka = require("../producer");

jest.mock("../redisClient", () => ({
  get: jest.fn(),
}));

jest.mock("../producer", () => jest.fn());

describe("POST /register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if client_id header is missing", async () => {
    const res = await request(app).post("/register").send({
      name: "Ranjet",
      email: "ranjeet@adsizzler.com",
      mobile: "9718071829",
      city: "Delhi",
    });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Client_id header is required." });
  });

  it("should return 403 if client status is not active", async () => {
    redisClient.get.mockImplementation((key, callback) => {
      callback(null, "inactive");
    });

    const res = await request(app)
      .post("/register")
      .set("client_id", "10")
      .send({
        name: "Ranjet",
        email: "ranjeet@adsizzler.com",
        mobile: "9718071829",
        city: "Delhi",
      });

    expect(redisClient.get).toHaveBeenCalledWith(
      "client_status",
      expect.any(Function)
    );
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Client status not active." });
  });

  it("should queue registration successfully if client status is active", async () => {
    redisClient.get.mockImplementation((key, callback) => {
      callback(null, "active");
    });

    sendToKafka.mockImplementation((topic, message) => {
      console.log(`Mock Kafka: Sent to topic ${topic}`, message); // Mock Kafka send
    });

    const res = await request(app)
      .post("/register")
      .set("client_id", "10")
      .send({
        name: "Ranjet",
        email: "ranjeet@adsizzler.com",
        mobile: "9718071829",
        city: "Delhi",
      });

    expect(redisClient.get).toHaveBeenCalledWith(
      "client_status",
      expect.any(Function)
    );
    expect(sendToKafka).toHaveBeenCalledWith("registration", {
      name: "Ranjet",
      email: "ranjeet@adsizzler.com",
      mobile: "9718071829",
      city: "Delhi",
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Registration queued successfully." });
  });

  it("should return 500 if Redis fails", async () => {
    redisClient.get.mockImplementation((key, callback) => {
      callback(new Error("Redis Error"));
    });

    const res = await request(app)
      .post("/register")
      .set("client_id", "10")
      .send({
        name: "Ranjet",
        email: "ranjeet@adsizzler.com",
        mobile: "9718071829",
        city: "Delhi",
      });

    expect(redisClient.get).toHaveBeenCalledWith(
      "client_status",
      expect.any(Function)
    );
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Redis Error", details: "Redis Error" });
  });
});
