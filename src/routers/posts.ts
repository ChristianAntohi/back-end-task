import { Router, RequestHandler } from 'express';
import { Op } from 'sequelize';

import type { SequelizeClient } from '../sequelize';
import type { Post } from '../repositories/types';

import { BadRequestError} from '../errors';
import { initTokenValidationRequestHandler, RequestAuth } from '../middleware/security';

export function initPostsRouter(sequelizeClient: SequelizeClient): Router {
    const router = Router({ mergeParams: true });
    const tokenValidation = initTokenValidationRequestHandler(sequelizeClient);
  
    router.route('/')
      .all(tokenValidation)
      .get(initListPostsRequestHandler(sequelizeClient))
      .post(initCreatePostRequestHandler(sequelizeClient));
  
    return router;
  }

function initListPostsRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
    return async function listPostsRequestHandler(req, res, next): Promise<void> {
      const { models } = sequelizeClient;
  
      try {
        const { auth: { user: { id: userId } } } = req as unknown as { auth: RequestAuth };
        const posts = await models.posts.findAll({
          where: {
            [Op.or]: [
              { isHidden: false },
              { isHidden: true, authorId: userId },
            ],
          },
        });
  
        res.send(posts);
      } catch (error) {
        next(error);
      }
    };
  }
  function initCreatePostRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
    return async function createPostRequestHandler(req, res, next): Promise<void> {
      const { models } = sequelizeClient;
  
      try {
        const { title, content } = req.body as Omit<CreatePostData, 'authorId'>;
        const { auth: { user: { id: authorId } } } = req as unknown as { auth: RequestAuth };
  
        if (!title || !content) {
          throw new BadRequestError('Title and content required');
        }
  
        const similarPost = await models.posts.findOne({
          where: {
            authorId, // Only consider posts by the same author
            [Op.or]: [
              { title },
              { content },
            ],
          },
        });
  
        if (similarPost) {
          if (similarPost.title === title) {
            throw new BadRequestError('You have already one post with this title');
          }
          if (similarPost.content === content) {
            throw new BadRequestError('You have already one post with this content');
          }
        }
  
        await models.posts.create({ title, content, authorId, isHidden: false });
  
        return res.status(204).end();
      } catch (error) {
        next(error);
      }
    };
  }

  type CreatePostData = Pick<Post, 'title' | 'content' | 'authorId' | 'isHidden'>;