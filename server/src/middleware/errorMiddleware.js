export function notFound(request, response, next) {
  const error = new Error(`Route not found: ${request.originalUrl}`);
  response.status(404);
  next(error);
}

export function errorHandler(error, _request, response, _next) {
  if (error.code === 11000) {
    response.status(409);
    response.json({
      message: "A record with that value already exists."
    });
    return;
  }

  if (error.name === "ValidationError") {
    response.status(400);
    response.json({
      message: Object.values(error.errors)
        .map((validationError) => validationError.message)
        .join(" ")
    });
    return;
  }

  if (error.name === "CastError") {
    response.status(400);
    response.json({
      message: "The requested resource id is invalid."
    });
    return;
  }

  const statusCode =
    error.statusCode ||
    (response.statusCode && response.statusCode !== 200 ? response.statusCode : 500);

  response.status(statusCode).json({
    message: error.message || "Server error."
  });
}
