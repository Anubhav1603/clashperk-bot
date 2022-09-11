import { CommandInteraction } from 'discord.js';
import { Collection, ObjectId } from 'mongodb';
import { Collections, Flags } from '../util/Constants.js';
import { Client } from './Client.js';

export interface ClanStore {
	_id: ObjectId;
	flag: number;
	name: string;
	tag: string;
	alias?: string;
	guild: string;
	patron: boolean;
	paused: boolean;
	active: boolean;
	createdAt: Date;
	verified: boolean;
	lastRan?: Date;
	channels?: string[];
	secureRole: boolean;
	roleIds?: string[];
	roles?: { coLeader?: string; admin?: string; member?: string }[];
}

export default class StorageHandler {
	public collection: Collection<ClanStore>;

	public constructor(private readonly client: Client) {
		this.collection = client.db.collection(Collections.CLAN_STORES);
	}

	public async find(id: string) {
		return this.collection.find({ guild: id }).toArray();
	}

	public async search(guildId: string, query: string[]) {
		if (!query.length) return [];
		return this.collection
			.find(
				{
					$or: [
						{
							tag: { $in: query.map((tag) => this.fixTag(tag)) }
						},
						{
							alias: { $in: query.map((alias) => alias) }
						}
					],
					guild: guildId
				},
				{ collation: { locale: 'en', strength: 2 } }
			)
			.toArray();
	}

	private fixTag(tag: string) {
		return `#${tag.toUpperCase().replace(/^#/g, '').replace(/O/g, '0')}`;
	}

	public async register(message: CommandInteraction, data: any) {
		const collection = await this.collection.findOneAndUpdate(
			{ tag: data.tag, guild: data.guild },
			{
				$set: {
					name: data.name,
					tag: data.tag,
					guild: message.guild!.id,
					paused: false,
					active: true,
					verified: true
				},
				$setOnInsert: {
					createdAt: new Date()
				},
				$bit: {
					flag: { or: Number(data.op) }
				}
			},
			{ upsert: true, returnDocument: 'after' }
		);

		const id = collection.value!._id.toHexString();
		switch (data.op) {
			case Flags.DONATION_LOG:
				await this.client.db.collection(Collections.DONATION_LOGS).updateOne(
					{ tag: data.tag, guild: data.guild },
					{
						$set: {
							clanId: new ObjectId(id),
							tag: data.tag,
							guild: data.guild,
							name: data.name,
							channel: data.channel,
							color: data.color,
							webhook: {
								id: data.webhook.id,
								token: data.webhook.token
							}
						},
						$min: {
							createdAt: new Date()
						}
					},
					{ upsert: true }
				);
				break;
			case Flags.CLAN_FEED_LOG:
				await this.client.db.collection(Collections.CLAN_FEED_LOGS).updateOne(
					{ tag: data.tag, guild: data.guild },
					{
						$set: {
							clanId: new ObjectId(id),
							tag: data.tag,
							guild: data.guild,
							name: data.name,
							channel: data.channel,
							role: data.role,
							webhook: {
								id: data.webhook.id,
								token: data.webhook.token
							}
						},
						$min: {
							createdAt: new Date()
						}
					},
					{ upsert: true }
				);
				break;
			case Flags.LAST_SEEN_LOG:
				await this.client.db.collection(Collections.LAST_SEEN_LOGS).updateOne(
					{ tag: data.tag, guild: data.guild },
					{
						$set: {
							clanId: new ObjectId(id),
							tag: data.tag,
							guild: data.guild,
							name: data.name,
							channel: data.channel,
							color: data.color,
							message: data.message,
							webhook: {
								id: data.webhook.id,
								token: data.webhook.token
							}
						},
						$min: {
							createdAt: new Date()
						}
					},
					{ upsert: true }
				);
				break;
			case Flags.CLAN_GAMES_LOG:
				await this.client.db.collection(Collections.CLAN_GAMES_LOGS).updateOne(
					{ tag: data.tag, guild: data.guild },
					{
						$set: {
							clanId: new ObjectId(id),
							tag: data.tag,
							guild: data.guild,
							name: data.name,
							channel: data.channel,
							color: data.color,
							message: data.message,
							webhook: {
								id: data.webhook.id,
								token: data.webhook.token
							}
						},
						$min: {
							createdAt: new Date()
						}
					},
					{ upsert: true }
				);
				break;
			case Flags.CLAN_EMBED_LOG:
				await this.client.db.collection(Collections.CLAN_EMBED_LOGS).updateOne(
					{ tag: data.tag, guild: data.guild },
					{
						$set: {
							clanId: new ObjectId(id),
							tag: data.tag,
							guild: data.guild,
							name: data.name,
							channel: data.channel,
							color: data.color,
							message: data.message,
							embed: data.embed
						},
						$min: {
							createdAt: new Date()
						}
					},
					{ upsert: true }
				);
				break;
			case Flags.CLAN_WAR_LOG:
				await this.client.db.collection(Collections.CLAN_WAR_LOGS).updateOne(
					{ tag: data.tag, guild: data.guild },
					{
						$set: {
							clanId: new ObjectId(id),
							tag: data.tag,
							guild: data.guild,
							name: data.name,
							channel: data.channel,
							webhook: {
								id: data.webhook.id,
								token: data.webhook.token
							}
						},
						$min: {
							createdAt: new Date()
						}
					},
					{ upsert: true }
				);
				break;
			default:
				break;
		}

		return id;
	}

	public async delete(id: string) {
		await this.client.db.collection(Collections.DONATION_LOGS).deleteOne({ clanId: new ObjectId(id) });

		await this.client.db.collection(Collections.CLAN_FEED_LOGS).deleteOne({ clanId: new ObjectId(id) });

		await this.client.db.collection(Collections.LAST_SEEN_LOGS).deleteOne({ clanId: new ObjectId(id) });

		await this.client.db.collection(Collections.CLAN_GAMES_LOGS).deleteOne({ clanId: new ObjectId(id) });

		await this.client.db.collection(Collections.CLAN_EMBED_LOGS).deleteOne({ clanId: new ObjectId(id) });

		await this.client.db.collection(Collections.CLAN_WAR_LOGS).deleteOne({ clanId: new ObjectId(id) });

		return this.client.db.collection(Collections.CLAN_STORES).deleteOne({ _id: new ObjectId(id) });
	}

	public async remove(id: string, data: any) {
		if (data.op === Flags.DONATION_LOG) {
			return this.client.db.collection(Collections.DONATION_LOGS).deleteOne({ clanId: new ObjectId(id) });
		}

		if (data.op === Flags.CLAN_FEED_LOG) {
			return this.client.db.collection(Collections.CLAN_FEED_LOGS).deleteOne({ clanId: new ObjectId(id) });
		}

		if (data.op === Flags.LAST_SEEN_LOG) {
			return this.client.db.collection(Collections.LAST_SEEN_LOGS).deleteOne({ clanId: new ObjectId(id) });
		}

		if (data.op === Flags.CLAN_GAMES_LOG) {
			return this.client.db.collection(Collections.CLAN_GAMES_LOGS).deleteOne({ clanId: new ObjectId(id) });
		}

		if (data.op === Flags.CLAN_EMBED_LOG) {
			return this.client.db.collection(Collections.CLAN_EMBED_LOGS).deleteOne({ clanId: new ObjectId(id) });
		}

		if (data.op === Flags.CLAN_WAR_LOG) {
			return this.client.db.collection(Collections.CLAN_WAR_LOGS).deleteOne({ clanId: new ObjectId(id) });
		}

		return null;
	}
}
