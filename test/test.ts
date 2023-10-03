
import expect from 'chai';
import sinon from 'sinon';
import express from 'express';
import request from 'supertest';
import { Sequelize, DataTypes, Model } from 'sequelize';
import { initUsersRouter } from '../src/routers/users';

const sequelize = new Sequelize('sqlite::memory:'); // Use an in-memory SQLite database

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    email: DataTypes.STRING,
  },
  {
    sequelize,
    modelName: 'User',
  }
);
// not finished