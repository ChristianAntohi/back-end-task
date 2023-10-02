/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
// TODO(roman): implement these
// external libraries can be used
// you can even ignore them and use your own preferred method
//done(christian)

export async function hashPassword(password: string): Promise<string> {
  const hashedPassword: string = await bcryptjs.hash(password, 10);
  return hashedPassword;
}

export function generateToken(data: TokenData): string {
  return jwt.sign(data, process.env.ACCESS_TOKEN_SECRET as string, {expiresIn: '1d'}) as unknown as string;
}

export function isValidToken(token: string): boolean {
  return !!jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as unknown as boolean;
}

// NOTE(roman): assuming that `isValidToken` will be called before
export function extraDataFromToken(token: string): TokenData {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as unknown as TokenData;
}

export interface TokenData {
  id: number;
}