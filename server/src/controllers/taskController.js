import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Task from "../models/Task.js";
import { escapeRegex, validateStatus } from "../utils/validation.js";

function validateTaskPayload({ title, description, status }, { partial = false } = {}) {
  const normalizedTitle = typeof title === "string" ? title.trim() : "";
  const normalizedDescription =
    typeof description === "string" ? description.trim() : undefined;

  if (!partial || title !== undefined) {
    if (!normalizedTitle) {
      const error = new Error("Task title is required.");
      error.statusCode = 400;
      throw error;
    }

    if (normalizedTitle.length > 80) {
      const error = new Error("Task title must be 80 characters or fewer.");
      error.statusCode = 400;
      throw error;
    }
  }

  if (description !== undefined && typeof description !== "string") {
    const error = new Error("Task description must be plain text.");
    error.statusCode = 400;
    throw error;
  }

  if (normalizedDescription !== undefined && normalizedDescription.length > 500) {
    const error = new Error("Task description must be 500 characters or fewer.");
    error.statusCode = 400;
    throw error;
  }

  if (status !== undefined && !validateStatus(status)) {
    const error = new Error("Task status must be either pending or completed.");
    error.statusCode = 400;
    throw error;
  }
}

async function findTaskForUser(taskId, userId) {
  if (!mongoose.isValidObjectId(taskId)) {
    const error = new Error("Task id is invalid.");
    error.statusCode = 400;
    throw error;
  }

  return Task.findOne({
    _id: taskId,
    userId
  });
}

export const getTasks = asyncHandler(async (request, response) => {
  const page = Math.max(Number.parseInt(request.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(request.query.limit, 10) || 6, 1), 20);
  const search = request.query.search?.trim() || "";
  const status = request.query.status || "all";

  if (!validateStatus(status, { allowAll: true })) {
    response.status(400);
    throw new Error("Status filter must be all, pending, or completed.");
  }

  const query = {
    userId: request.user._id
  };

  if (status !== "all") {
    query.status = status;
  }

  if (search) {
    const safeSearch = escapeRegex(search);
    query.$or = [
      {
        title: {
          $regex: safeSearch,
          $options: "i"
        }
      },
      {
        description: {
          $regex: safeSearch,
          $options: "i"
        }
      }
    ];
  }

  const summaryBaseQuery = {
    userId: request.user._id
  };

  const [matchingTasks, totalTaskCount, pendingCount, completedCount, tasks] = await Promise.all([
    Task.countDocuments(query),
    Task.countDocuments(summaryBaseQuery),
    Task.countDocuments({
      ...summaryBaseQuery,
      status: "pending"
    }),
    Task.countDocuments({
      ...summaryBaseQuery,
      status: "completed"
    }),
    Task.find(query)
      .sort({
        updatedAt: -1,
        createdAt: -1
      })
      .skip((page - 1) * limit)
      .limit(limit)
  ]);

  response.json({
    tasks,
    page,
    totalPages: Math.max(Math.ceil(matchingTasks / limit), 1),
    totalTasks: matchingTasks,
    summary: {
      all: totalTaskCount,
      pending: pendingCount,
      completed: completedCount
    }
  });
});

export const createTask = asyncHandler(async (request, response) => {
  const { title, description, status } = request.body;
  validateTaskPayload({ title, description, status });

  const task = await Task.create({
    title: title.trim(),
    description: description?.trim() || "",
    status: status || "pending",
    userId: request.user._id
  });

  response.status(201).json(task);
});

export const updateTask = asyncHandler(async (request, response) => {
  const task = await findTaskForUser(request.params.id, request.user._id);
  const { title, description, status } = request.body;

  if (!task) {
    response.status(404);
    throw new Error("Task not found.");
  }

  validateTaskPayload({ title, description, status }, { partial: true });

  task.title = title !== undefined ? title.trim() : task.title;
  task.description = description !== undefined ? description.trim() : task.description;
  task.status = status || task.status;

  const updatedTask = await task.save();
  response.json(updatedTask);
});

export const toggleTaskStatus = asyncHandler(async (request, response) => {
  const task = await findTaskForUser(request.params.id, request.user._id);
  const { status } = request.body;

  if (!task) {
    response.status(404);
    throw new Error("Task not found.");
  }

  if (status !== undefined && !validateStatus(status)) {
    response.status(400);
    throw new Error("Task status must be either pending or completed.");
  }

  task.status = status || (task.status === "completed" ? "pending" : "completed");

  const updatedTask = await task.save();
  response.json(updatedTask);
});

export const deleteTask = asyncHandler(async (request, response) => {
  const task = await findTaskForUser(request.params.id, request.user._id);

  if (!task) {
    response.status(404);
    throw new Error("Task not found.");
  }

  await task.deleteOne();

  response.json({
    message: "Task deleted successfully."
  });
});
