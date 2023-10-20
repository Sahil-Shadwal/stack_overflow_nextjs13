"use server";

import { connectToDatabase } from "../mongoose";

export async function createQuestion(params) {
  // eslint-disable-next-line no-empty
  try {
    connectToDatabase();
  } catch (error) {}
}
