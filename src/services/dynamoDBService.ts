import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  UpdateCommand, 
  DeleteCommand, 
  ScanCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb';

export class DynamoDBService {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(tableName: string) {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = tableName;
  }

  async create(item: Record<string, any>): Promise<void> {
    if (!item.id || !item.email) {
      throw new Error('Both id and email are required');
    }

    const command = new PutCommand({
      TableName: this.tableName,
      Item: item,
    });

    await this.docClient.send(command);
  }

  async getByIdAndEmail(id: string, email: string): Promise<Record<string, any> | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        id,
        email,
      },
    });

    const response = await this.docClient.send(command);
    return response.Item || null;
  }

  async update(id: string, email: string, updates: Record<string, any>): Promise<void> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value], index) => {
      if (key !== 'id' && key !== 'email') {
        const updateName = `#attr${index}`;
        const updateValue = `:val${index}`;
        updateExpressions.push(`${updateName} = ${updateValue}`);
        expressionAttributeNames[updateName] = key;
        expressionAttributeValues[updateValue] = value;
      }
    });

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { id, email },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    await this.docClient.send(command);
  }

  async delete(id: string, email: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        id,
        email,
      },
    });

    await this.docClient.send(command);
  }

  async scan(): Promise<Record<string, any>[]> {
    const command = new ScanCommand({
      TableName: this.tableName,
    });

    const response = await this.docClient.send(command);
    return response.Items || [];
  }

  async persist(item: Record<string, any>): Promise<void> {
    console.log('Persisting item:', item);
    
    if (!item.id || !item.email) {
      throw new Error('Both id and email are required');
    }

    // Check if record exists
    const existing = await this.getByIdAndEmail(item.id, item.email);

    if (existing) {
      // If exists, update
      const updates = { ...item };
      delete updates.id; // Remove id from updates as it's the partition key
      delete updates.email; // Remove email from updates as it's the sort key
      await this.update(item.id, item.email, updates);
    } else {
      // If doesn't exist, create
      await this.create(item);
    }
  }

  // Optional: Add a query method to query by partition key
  async queryById(id: string): Promise<Record<string, any>[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: '#id = :id',
      ExpressionAttributeNames: {
        '#id': 'id'
      },
      ExpressionAttributeValues: {
        ':id': id
      }
    });

    const response = await this.docClient.send(command);
    return response.Items || [];
  }
} 