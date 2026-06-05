import assert from "node:assert/strict";
import test, { after, afterEach, before } from "node:test";
import mongoose from "mongoose";
import request from "supertest";
import app from "../app.js";
import { connectDB, disconnectDB } from "../config/db.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

before(async () => {
  await connectDB();
});

afterEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

after(async () => {
  await disconnectDB();
});

async function registerAndAuthenticateUser() {
  const email = `taskflow.${Date.now()}.${Math.random().toString(36).slice(2)}@example.com`;
  const response = await request(app).post("/api/auth/register").send({
    name: "Test User",
    email,
    password: "secret123"
  });

  assert.equal(response.statusCode, 201);

  return {
    email,
    token: response.body.token,
    user: response.body.user
  };
}

test("registers, restores auth, and completes the full task lifecycle", async () => {
  const { email, token, user } = await registerAndAuthenticateUser();
  const headers = {
    Authorization: `Bearer ${token}`
  };

  assert.equal(user.email, email);

  const meResponse = await request(app).get("/api/auth/me").set(headers);
  assert.equal(meResponse.statusCode, 200);
  assert.equal(meResponse.body.user.email, email);

  const createResponse = await request(app).post("/api/tasks").set(headers).send({
    title: "Ship polished submission",
    description: "Finish the MERN assignment with tests and clean UX.",
    status: "pending"
  });

  assert.equal(createResponse.statusCode, 201);
  assert.equal(createResponse.body.title, "Ship polished submission");

  const taskId = createResponse.body._id;

  const updateResponse = await request(app).put(`/api/tasks/${taskId}`).set(headers).send({
    title: "Ship polished internship submission",
    description: "Finish the MERN assignment with tests, docs, and clean UX.",
    status: "completed"
  });

  assert.equal(updateResponse.statusCode, 200);
  assert.equal(updateResponse.body.status, "completed");

  const listResponse = await request(app)
    .get("/api/tasks?status=completed&search=internship&page=1&limit=6")
    .set(headers);

  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.body.totalTasks, 1);
  assert.equal(listResponse.body.summary.all, 1);
  assert.equal(listResponse.body.tasks[0]._id, taskId);

  const toggleResponse = await request(app)
    .patch(`/api/tasks/${taskId}/status`)
    .set(headers)
    .send({
      status: "pending"
    });

  assert.equal(toggleResponse.statusCode, 200);
  assert.equal(toggleResponse.body.status, "pending");

  const deleteResponse = await request(app).delete(`/api/tasks/${taskId}`).set(headers);
  assert.equal(deleteResponse.statusCode, 200);
  assert.equal(deleteResponse.body.message, "Task deleted successfully.");
});

test("rejects invalid auth and task payloads with clear responses", async () => {
  const invalidRegisterResponse = await request(app).post("/api/auth/register").send({
    name: "A",
    email: "invalid-email",
    password: "123"
  });

  assert.equal(invalidRegisterResponse.statusCode, 400);

  const { token } = await registerAndAuthenticateUser();
  const headers = {
    Authorization: `Bearer ${token}`
  };

  const invalidFilterResponse = await request(app)
    .get("/api/tasks?status=archived")
    .set(headers);
  assert.equal(invalidFilterResponse.statusCode, 400);

  const invalidTaskResponse = await request(app).post("/api/tasks").set(headers).send({
    title: "   ",
    description: "bad title"
  });
  assert.equal(invalidTaskResponse.statusCode, 400);

  const invalidIdResponse = await request(app).delete("/api/tasks/not-a-valid-id").set(headers);
  assert.equal(invalidIdResponse.statusCode, 400);
});
