import { type Message, type InsertMessage } from "@shared/schema";

export interface IStorage {
  getMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class MemStorage implements IStorage {
  private messages: Map<number, Message>;
  private currentId: number;

  constructor() {
    this.messages = new Map();
    this.currentId = 1;
    
    // Seed some initial data so the app isn't completely empty
    this.createMessage({ content: "Welcome to your new blank Node.js + Express app!" });
    this.createMessage({ content: "The backend is ready to accept requests." });
  }

  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentId++;
    const message: Message = { ...insertMessage, id };
    this.messages.set(id, message);
    return message;
  }
}

export const storage = new MemStorage();
