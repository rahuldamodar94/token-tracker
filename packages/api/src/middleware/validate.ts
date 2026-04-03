import { Request, Response, NextFunction } from "express";
import { z } from "zod";

declare global {
  namespace Express {
    interface Request {
      validated: {
        params: any;
        query: any;
      };
    }
  }
}

export function validate(schema: {
  params?: z.ZodType<any>;
  query?: z.ZodType<any>;
  body?: z.ZodType<any>;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, any> = {};
    req.validated = { params: {}, query: {} };

    if (schema.params) {
      const result = schema.params.safeParse(req.params);
      if (!result.success) {
        errors.params = result.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
      } else {
        req.validated.params = result.data;
      }
    }

    if (schema.query) {
      const result = schema.query.safeParse(req.query);
      if (!result.success) {
        errors.query = result.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
      } else {
        req.validated.query = result.data;
      }
    }

    if (schema.body) {
      const result = schema.body.safeParse(req.body);
      if (!result.success) {
        errors.body = result.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
      } else {
        req.body = result.data;
      }
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({
        data: null,
        message: "Validation failed",
        error: errors,
      });
      return;
    }

    next();
  };
}
