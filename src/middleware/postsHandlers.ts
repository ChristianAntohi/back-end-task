/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Op } from 'sequelize';
import { RequestHandler } from 'express';
import type { SequelizeClient } from '../sequelize';
import type { Post } from '../repositories/types';
import { UserType } from '../constants';
import { BadRequestError} from '../errors';
import { RequestAuth, RequestParams } from '../middleware/security';

export function initListPostsRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
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
export function initCreatePostRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
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
export function initViewPostsRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function viewPostRequestHandler(req, res, next): Promise<void> {
    const { models } = sequelizeClient;

    try {
        const { auth: { user: { id: userId, type: userType } } } = req as unknown as { auth: RequestAuth };
        const { params: { id: postId } } = req as unknown as { params: RequestParams };
      
      const foundPost = await models.posts.findOne({
        where: { id: postId },
      });
      
      if (!foundPost) {
        throw new BadRequestError('Post not found');
      }

      if (((userType !== UserType.ADMIN && foundPost.isHidden) || (!foundPost.isHidden && foundPost.authorId !== userId))) {
        throw new BadRequestError('Post not found');
      }

      res.send(foundPost);
    } catch (error) {
      next(error);
    }
  };
}

export const initEditPostRequestHandler = (sequelizeClient: SequelizeClient): RequestHandler => {
    return async function editPostRequestHandler(req, res, next) {
      const { models } = sequelizeClient;
  
      try {
        const { title, content, isHidden } = req.body as CreatePostData;
        const { auth: { user: { id: authorId } } } = req as unknown as { auth: RequestAuth };
        const { params: { id: postId } } = req as unknown as { params: RequestParams };
  
        if (!title || !content) {
          throw new BadRequestError('Title and content required');
        }
  
        if (!postId) {
          throw new BadRequestError('ID of post required');
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
  
        const postToUpdate = await models.posts.findOne({
          where: {
            id: postId,
            authorId,
          },
        });
  
        if (!postToUpdate) {
          throw new BadRequestError('Post not found');
        }
  
        const updates: Partial<Post> = {};
  
        if (title) {
          updates.title = title;
        }
  
        if (content) {
          updates.content = content;
        }
  
        if (isHidden !== undefined && isHidden !== postToUpdate.isHidden) {
          updates.isHidden = isHidden;
        }
  
        await postToUpdate.update(updates);
  
        return res.status(200).send({ postToUpdate }).end();
      } catch (error) {
        next(error);
      }
    };
  };

export function initDeletePostRequestHandler(sequelizeClient: SequelizeClient): RequestHandler{
    return async function deletePostRequestHandler(req, res, next) {
      const { models } = sequelizeClient;
      try {
        const { auth: { user: { id: userId, type: userType } } } = req as unknown as { auth: RequestAuth };
        const { params: { id: postId } } = req as unknown as { params: RequestParams };
  
        if(!postId) {
          throw new BadRequestError('ID of Post required');
        }
  
        const isAdmin = userType === UserType.ADMIN;
  
        const postToDelete = await models.posts.findOne({
          where: {
            [Op.or]: [
              { id: postId },
            ],
          },
        });
  
        if(!postToDelete) {
          throw new BadRequestError('Post not found');
        }
  
        if(postToDelete.authorId !== userId) {
          if(!isAdmin) {
            throw new BadRequestError('Unauthorized');
          }
          if(postToDelete.isHidden) {
            throw new BadRequestError('Unauthorized');
          }
          await postToDelete.destroy();
        }
  
        if(postToDelete.authorId === userId){
          await postToDelete.destroy();
        }
  
        return res.status(200).end();
      } catch (error) {
        next(error);
      }
    };
  }



type CreatePostData = Pick<Post, 'title' | 'content' | 'authorId' | 'isHidden'>;