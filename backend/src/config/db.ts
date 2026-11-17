import { MongoClient, type Collection, type Db } from "mongodb";
import { env } from "./env.js";
import type {
  AuditLogDocument,
  ItemDocument,
  UserDocument,
} from "../types/models.js";

const DATABASE_NAME = "upemor_lost_found";

class DatabaseSingleton {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  public async connect(): Promise<Db> {
    if (this.db) {
      return this.db;
    }

    if (!env.mongodbUri) {
      throw new Error("MONGODB_URI is not configured in environment variables.");
    }

    this.client = new MongoClient(env.mongodbUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    });

    await this.client.connect();
    this.db = this.client.db(DATABASE_NAME);

    await this.ensureIndexes();
    console.log(`[db] Connected to MongoDB Atlas database "${DATABASE_NAME}".`);
    return this.db;
  }

  private async ensureIndexes(): Promise<void> {
    if (!this.db) return;

    const users = this.db.collection<UserDocument>("usuarios");
    const items = this.db.collection<ItemDocument>("objetos");
    const auditLogs = this.db.collection<AuditLogDocument>("bitacora");

    await Promise.all([
      users.createIndex({ correo: 1 }, { unique: true }),
      items.createIndex({ estado: 1, fecha_registro: -1 }),
      items.createIndex({ usuario_id: 1, fecha_registro: -1 }),
      auditLogs.createIndex({ fecha: -1 }),
    ]);
  }

  public getDb(): Db {
    if (!this.db) {
      throw new Error("Database connection has not been initialized.");
    }
    return this.db;
  }

  public getUsersCollection(): Collection<UserDocument> {
    return this.getDb().collection<UserDocument>("usuarios");
  }

  public getItemsCollection(): Collection<ItemDocument> {
    return this.getDb().collection<ItemDocument>("objetos");
  }

  public getAuditCollection(): Collection<AuditLogDocument> {
    return this.getDb().collection<AuditLogDocument>("bitacora");
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log("[db] MongoDB connection closed.");
    }
  }
}

export const database = new DatabaseSingleton();
