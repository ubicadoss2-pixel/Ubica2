import { Request, Response } from "express";
import { createCommentSchema } from "./comment.schema";
import { createComment, listComments, updateComment, deleteComment, likeComment } from "./comment.service";
 
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

export const update = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const commentId = String(req.params.id);
    const { content, rating } = req.body;
    const comment = await updateComment(commentId, userId, { content, rating });
    res.json(comment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const commentId = String(req.params.id);
    await deleteComment(commentId, userId);
    res.status(204).end();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const like = async (req: Request, res: Response) => {
  try {
    const commentId = String(req.params.id);
    const { increment } = req.body;
    const comment = await likeComment(commentId, increment !== false);
    res.json(comment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
