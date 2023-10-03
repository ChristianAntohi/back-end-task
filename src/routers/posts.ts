import { Router } from 'express';
import type { SequelizeClient } from '../sequelize';
import { initTokenValidationRequestHandler} from '../middleware/security';
import { initListPostsRequestHandler, initCreatePostRequestHandler, initViewPostsRequestHandler, initEditPostRequestHandler, initDeletePostRequestHandler} from '../middleware/postsHandlers';

export function initPostsRouter(sequelizeClient: SequelizeClient): Router {
    const router = Router({ mergeParams: true });
    const tokenValidation = initTokenValidationRequestHandler(sequelizeClient);
  
    router.route('/')
      .all(tokenValidation)
      .get(initListPostsRequestHandler(sequelizeClient))
      .post(initCreatePostRequestHandler(sequelizeClient));
  
      router.route('/:id')
      .all(tokenValidation)
      .get(initViewPostsRequestHandler(sequelizeClient))
      .put(initEditPostRequestHandler(sequelizeClient))
      .delete(initDeletePostRequestHandler(sequelizeClient));

    return router;
  }