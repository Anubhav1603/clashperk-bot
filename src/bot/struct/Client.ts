import { fileURLToPath, URL } from 'node:url';
import Discord, { Message, Options, Snowflake, GatewayIntentBits, BaseInteraction } from 'discord.js';
import { Db } from 'mongodb';
import { container } from 'tsyringe';
import { nanoid } from 'nanoid';
import * as Redis from 'redis';
import { CommandHandler, InhibitorHandler, ListenerHandler } from '../lib/index.js';
import Logger from '../util/Logger.js';
import { Settings } from '../util/Constants.js';
import { Database } from './Database.js';
import Http from './Http.js';
import SettingsProvider from './SettingsProvider.js';
import StorageHandler from './StorageHandler.js';
import Resolver from './Resolver.js';

export class Client extends Discord.Client {
	public commandHandler = new CommandHandler(this, {
		directory: fileURLToPath(new URL('../commands', import.meta.url))
	});

	public listenerHandler = new ListenerHandler(this, {
		directory: fileURLToPath(new URL('../listeners', import.meta.url))
	});

	public inhibitorHandler = new InhibitorHandler(this, {
		directory: fileURLToPath(new URL('../inhibitors', import.meta.url))
	});

	public logger: Logger;
	public db!: Db;
	public settings!: SettingsProvider;
	public http = new Http();
	public storage!: StorageHandler;

	public redis = Redis.createClient({
		url: process.env.REDIS_URL,
		database: 1
	});

	public subscriber = this.redis.duplicate();
	public publisher = this.redis.duplicate();

	public components = new Map<string, string[]>();
	public resolver!: Resolver;
	public ownerId: string;

	public constructor() {
		super({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMembers,
				GatewayIntentBits.GuildWebhooks,
				GatewayIntentBits.GuildMessages
			],
			makeCache: Options.cacheWithLimits({
				...Options.DefaultMakeCacheSettings,
				PresenceManager: 0,
				VoiceStateManager: 0,
				GuildBanManager: 0,
				GuildInviteManager: 0,
				GuildScheduledEventManager: 0,
				GuildStickerManager: 0,
				StageInstanceManager: 0,
				ReactionUserManager: 0,
				ReactionManager: 0,
				BaseGuildEmojiManager: 0,
				GuildEmojiManager: 0,
				ApplicationCommandManager: 0,
				ThreadMemberManager: 0,
				MessageManager: 10,
				UserManager: {
					maxSize: 1,
					keepOverLimit: (user) => user.id === this.user!.id
				},
				GuildMemberManager: {
					maxSize: 1,
					keepOverLimit: (member) => member.id === this.user!.id
				}
			}),
			sweepers: {
				...Options.DefaultSweeperSettings,
				messages: {
					interval: 5 * 60,
					lifetime: 10 * 60
				}
			}
		});

		this.logger = new Logger(this);
		this.ownerId = process.env.OWNER!;
		container.register(Client, { useValue: this });
	}

	public isOwner(user: string | Discord.User) {
		const userId = this.users.resolveId(user);
		return userId === process.env.OWNER!;
	}

	public embed(guild: Message | Snowflake | BaseInteraction) {
		return this.settings.get<number>(typeof guild === 'string' ? guild : guild.guild!, Settings.COLOR, null);
	}

	public uuid(...userIds: Snowflake[]) {
		const uniqueId = nanoid();
		this.components.set(uniqueId, userIds);
		return uniqueId;
	}

	public async init(token: string) {
		await this.commandHandler.register();
		await this.listenerHandler.register();
		await this.inhibitorHandler.register();

		await Database.connect().then(() => this.logger.info('Connected to MongoDB', { label: 'DATABASE' }));
		this.db = Database.db('clashperk');

		this.settings = new SettingsProvider(this.db);
		await this.settings.init();

		await this.redis.connect();
		await this.subscriber.connect();
		await this.publisher.connect();

		this.storage = new StorageHandler(this);

		this.resolver = new Resolver(this);

		await this.http.login();

		this.logger.debug('Connecting to the Gateway', { label: 'DISCORD' });
		return this.login(token);
	}
}

export default Client;
