import { Router, RequestHandler } from 'express';
import type { SequelizeClient } from '../sequelize';
import { initTokenValidationRequestHandler, initAdminValidationRequestHandler } from '../middleware/security';
import { initListUsersRequestHandler, initCreateUserRequestHandler, initLoginUserRequestHandler, initRegisterUserRequestHandler, createUser } from '../middleware/userHandlers';

export function initUsersRouter(sequelizeClient: SequelizeClient): Router {
  const router = Router({ mergeParams: true });

  const tokenValidation = initTokenValidationRequestHandler(sequelizeClient);
  const adminValidation = initAdminValidationRequestHandler();

  router.route('/')
    .get(tokenValidation, initListUsersRequestHandler(sequelizeClient))
    .post(tokenValidation, adminValidation, initCreateUserRequestHandler(sequelizeClient));

  router.route('/login')
    .post(tokenValidation, initLoginUserRequestHandler(sequelizeClient));
  router.route('/register')
    .post(initRegisterUserRequestHandler(sequelizeClient));

  return router;
}