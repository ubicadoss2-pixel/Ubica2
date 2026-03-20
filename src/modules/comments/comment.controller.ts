import { Request, Response } from "express";
import { createCommentSchema } from "./comment.schema";
import { createComment, listComments } from "./comment.service";

export const create = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const body = createCommentSchema.parse(req.body);
    const comment = await createComment(body, userId);
    res.status(201).json(comment);
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({ error: "Datos invalidos", details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const result = await listComments(req.query);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
