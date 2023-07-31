// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
	PutCommand,
	GetCommand,
	UpdateCommand,
	DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';

type Data = {
	item: unknown;
};

const ddbClient = new DynamoDBClient({
	region: (process.env['REGION'] ?? 'ap-south-1') as string,
	credentials: {
		accessKeyId: (process.env['AWS_ACCESS_KEY_ID'] ?? '') as string,
		secretAccessKey: (process.env['AWS_SECRET_ACCESS_KEY'] ?? '') as string,
	},
});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

const dynamo = {
	putItem: async (
		TableName: string,
		Item: Record<string, NativeAttributeValue>
	) => {
		return ddbDocClient.send(new PutCommand({ TableName, Item }));
	},
	getItem: async (
		TableName: string,
		Key: Record<string, NativeAttributeValue>
	) => {
		return await ddbDocClient.send(
			new GetCommand({
				TableName,
				Key,
			})
		);
	},
	updateItem: async (
		TableName: string,
		Key: Record<string, NativeAttributeValue>,
		Item: Record<string, NativeAttributeValue>
	) => {
		const keys = Object.keys(Item);
		let UpdateExpression = `set `;
		const ExpressionAttributeValues: Record<string, NativeAttributeValue> =
			{};
		keys.forEach((key) => {
			UpdateExpression += `${key} = :${key}`;
			ExpressionAttributeValues[key] = Item[key];
		});

		const command = new UpdateCommand({
			TableName,
			Key,
			UpdateExpression,
			ExpressionAttributeValues,
			ReturnValues: 'ALL_NEW',
		});

		return ddbDocClient.send(command);
	},
};

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<Data>
) {
	const data = await dynamo.getItem('test', { pid: 'p123' });
	res.status(200).json({ item: data.Item });
}
