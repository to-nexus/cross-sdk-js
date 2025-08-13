import { EventEmitter } from "events";
import { HEARTBEAT_EVENTS } from "@walletconnect/heartbeat";
import { ErrorResponse, RequestArguments } from "@walletconnect/jsonrpc-types";
import { generateChildLogger, getLoggerContext, Logger } from "@walletconnect/logger";
import { RelayJsonRpc } from "@walletconnect/relay-api";
import { ONE_SECOND, ONE_MINUTE, Watch, toMiliseconds } from "@walletconnect/time";
import {
  IRelayer,
  ISubscriber,
  RelayerTypes,
  SubscriberEvents,
  SubscriberTypes,
} from "@walletconnect/types";
import {
  getSdkError,
  getInternalError,
  getRelayProtocolApi,
  getRelayProtocolName,
  createExpiringPromise,
  hashMessage,
  sleep,
} from "@walletconnect/utils";
import {
  CORE_STORAGE_PREFIX,
  SUBSCRIBER_CONTEXT,
  SUBSCRIBER_EVENTS,
  SUBSCRIBER_STORAGE_VERSION,
  PENDING_SUB_RESOLUTION_TIMEOUT,
  RELAYER_EVENTS,
  TRANSPORT_TYPES,
} from "../constants";
import { SubscriberTopicMap } from "./topicmap";

export class Subscriber extends ISubscriber {
  public subscriptions = new Map<string, SubscriberTypes.Active>();
  public topicMap = new SubscriberTopicMap();
  public events = new EventEmitter();
  public name = SUBSCRIBER_CONTEXT;
  public version = SUBSCRIBER_STORAGE_VERSION;
  public pending = new Map<string, SubscriberTypes.Params>();

  private cached: SubscriberTypes.Active[] = [];
  private initialized = false;
  private pendingSubscriptionWatchLabel = "pending_sub_watch_label";
  private pollingInterval = 20;
  private storagePrefix = CORE_STORAGE_PREFIX;
  private subscribeTimeout = toMiliseconds(ONE_MINUTE);
  private initialSubscribeTimeout = toMiliseconds(ONE_SECOND * 15);
  private clientId: string;
  private batchSubscribeTopicsLimit = 500;

  constructor(public relayer: IRelayer, public logger: Logger) {
    console.log("###?? constructor : ", new Date().toLocaleTimeString());
    super(relayer, logger);
    this.relayer = relayer;
    this.logger = generateChildLogger(logger, this.name);
    this.clientId = ""; // assigned when calling this.getClientId()
  }

  public init: ISubscriber["init"] = async () => {
    console.log("###?? init : ", new Date().toLocaleTimeString());
    if (!this.initialized) {
      this.logger.trace(`Initialized`);
      this.registerEventListeners();
      await this.restore();
    }
    this.initialized = true;
  };

  get context() {
    console.log("###?? context : ", new Date().toLocaleTimeString());
    return getLoggerContext(this.logger);
  }

  get storageKey() {
    console.log("###?? storageKey : ", new Date().toLocaleTimeString());
    return (
      this.storagePrefix + this.version + this.relayer.core.customStoragePrefix + "//" + this.name
    );
  }

  get length() {
    console.log("###?? length : ", new Date().toLocaleTimeString());
    return this.subscriptions.size;
  }

  get ids() {
    console.log("###?? ids : ", new Date().toLocaleTimeString());
    return Array.from(this.subscriptions.keys());
  }

  get values() {
    console.log("###?? values : ", new Date().toLocaleTimeString());
    return Array.from(this.subscriptions.values());
  }

  get topics() {
    console.log("###?? topics : ", new Date().toLocaleTimeString());
    return this.topicMap.topics;
  }

  get hasAnyTopics() {
    console.log("###?? hasAnyTopics : ", new Date().toLocaleTimeString());
    return (
      this.topicMap.topics.length > 0 ||
      this.pending.size > 0 ||
      this.cached.length > 0 ||
      this.subscriptions.size > 0
    );
  }

  public subscribe: ISubscriber["subscribe"] = async (topic, opts) => {
    console.log("###?? subscribe : ", new Date().toLocaleTimeString());
    this.isInitialized();
    this.logger.debug(`Subscribing Topic`);
    this.logger.trace({ type: "method", method: "subscribe", params: { topic, opts } });
    try {
      const relay = getRelayProtocolName(opts);
      const params = { topic, relay, transportType: opts?.transportType };
      this.pending.set(topic, params);
      const id = await this.rpcSubscribe(topic, relay, opts);
      if (typeof id === "string") {
        this.onSubscribe(id, params);
        this.logger.debug(`Successfully Subscribed Topic`);
        this.logger.trace({ type: "method", method: "subscribe", params: { topic, opts } });
      }
      return id;
    } catch (e) {
      this.logger.debug(`Failed to Subscribe Topic`);
      this.logger.error(e as any);
      throw e;
    }
  };

  public unsubscribe: ISubscriber["unsubscribe"] = async (topic, opts) => {
    console.log("###?? unsubscribe : ", new Date().toLocaleTimeString());
    this.isInitialized();
    if (typeof opts?.id !== "undefined") {
      await this.unsubscribeById(topic, opts.id, opts);
    } else {
      await this.unsubscribeByTopic(topic, opts);
    }
  };

  public isSubscribed: ISubscriber["isSubscribed"] = async (topic: string) => {
    console.log("###?? isSubscribed : ", new Date().toLocaleTimeString());
    // topic subscription is already resolved
    if (this.topics.includes(topic)) return true;
    const label = `${this.pendingSubscriptionWatchLabel}_${topic}`;
    // wait for the subscription to resolve
    const exists = await new Promise<boolean>((resolve, reject) => {
      const watch = new Watch();
      watch.start(label);
      const interval = setInterval(() => {
        if (
          (!this.pending.has(topic) && this.topics.includes(topic)) ||
          this.cached.some((s) => s.topic === topic)
        ) {
          clearInterval(interval);
          watch.stop(label);
          resolve(true);
        }
        if (watch.elapsed(label) >= PENDING_SUB_RESOLUTION_TIMEOUT) {
          clearInterval(interval);
          watch.stop(label);
          reject(new Error("Subscription resolution timeout"));
        }
      }, this.pollingInterval);
    }).catch(() => false);
    return exists;
  };

  public on: ISubscriber["on"] = (event, listener) => {
    console.log("###?? on : ", new Date().toLocaleTimeString());
    this.events.on(event, listener);
  };

  public once: ISubscriber["once"] = (event, listener) => {
    console.log("###?? once : ", new Date().toLocaleTimeString());
    this.events.once(event, listener);
  };

  public off: ISubscriber["off"] = (event, listener) => {
    console.log("###?? off : ", new Date().toLocaleTimeString());
    this.events.off(event, listener);
  };

  public removeListener: ISubscriber["removeListener"] = (event, listener) => {
    console.log("###?? removeListener : ", new Date().toLocaleTimeString());
    this.events.removeListener(event, listener);
  };

  public start: ISubscriber["start"] = async () => {
    console.log("###?? start : ", new Date().toLocaleTimeString());
    await this.onConnect();
  };

  public stop: ISubscriber["stop"] = async () => {
    console.log("###?? stop : ", new Date().toLocaleTimeString());
    await this.onDisconnect();
  };

  // ---------- Private ----------------------------------------------- //

  private hasSubscription(id: string, topic: string) {
    console.log("###?? hasSubscription : ", new Date().toLocaleTimeString());
    let result = false;
    try {
      const subscription = this.getSubscription(id);
      result = subscription.topic === topic;
    } catch (e) {
      // ignore error
    }
    return result;
  }

  private reset() {
    console.log("###?? reset : ", new Date().toLocaleTimeString());
    this.cached = [];
    this.initialized = true;
  }

  private onDisable() {
    console.log("###?? onDisable : ", new Date().toLocaleTimeString());
    this.cached = this.values;
    this.subscriptions.clear();
    this.topicMap.clear();
  }

  private async unsubscribeByTopic(topic: string, opts?: RelayerTypes.UnsubscribeOptions) {
    console.log("###?? unsubscribeByTopic : ", new Date().toLocaleTimeString());
    const ids = this.topicMap.get(topic);
    await Promise.all(ids.map(async (id) => await this.unsubscribeById(topic, id, opts)));
  }

  private async unsubscribeById(topic: string, id: string, opts?: RelayerTypes.UnsubscribeOptions) {
    console.log("###?? unsubscribeById : ", new Date().toLocaleTimeString());
    this.logger.debug(`Unsubscribing Topic`);
    this.logger.trace({ type: "method", method: "unsubscribe", params: { topic, id, opts } });

    try {
      const relay = getRelayProtocolName(opts);
      await this.restartToComplete({ topic, id, relay });
      await this.rpcUnsubscribe(topic, id, relay);
      const reason = getSdkError("USER_DISCONNECTED", `${this.name}, ${topic}`);
      await this.onUnsubscribe(topic, id, reason);
      this.logger.debug(`Successfully Unsubscribed Topic`);
      this.logger.trace({ type: "method", method: "unsubscribe", params: { topic, id, opts } });
    } catch (e) {
      this.logger.debug(`Failed to Unsubscribe Topic`);
      this.logger.error(e as any);
      throw e;
    }
  }

  private async rpcSubscribe(
    topic: string,
    relay: RelayerTypes.ProtocolOptions,
    opts?: RelayerTypes.SubscribeOptions,
  ) {
    console.log("###?? rpcSubscribe : ", new Date().toLocaleTimeString());
    if (!opts || opts?.transportType === TRANSPORT_TYPES.relay) {
      await this.restartToComplete({ topic, id: topic, relay });
    }
    const api = getRelayProtocolApi(relay.protocol);
    const request: RequestArguments<RelayJsonRpc.SubscribeParams> = {
      method: api.subscribe,
      params: {
        topic,
      },
    };
    this.logger.debug(`Outgoing Relay Payload`);
    this.logger.trace({ type: "payload", direction: "outgoing", request });
    const shouldThrow = opts?.internal?.throwOnFailedPublish;
    try {
      const subId = await this.getSubscriptionId(topic);
      // in link mode, allow the app to update its network state (i.e. active airplane mode) with small delay before attempting to subscribe
      if (opts?.transportType === TRANSPORT_TYPES.link_mode) {
        setTimeout(() => {
          if (this.relayer.connected || this.relayer.connecting) {
            this.relayer.request(request).catch((e) => this.logger.warn(e));
          }
        }, toMiliseconds(ONE_SECOND));
        return subId;
      }
      const subscribePromise = new Promise(async (resolve) => {
        const onSubscribe = (subscription: SubscriberEvents.Created) => {
          if (subscription.topic === topic) {
            this.events.removeListener(SUBSCRIBER_EVENTS.created, onSubscribe);
            resolve(subscription.id);
          }
        };
        this.events.on(SUBSCRIBER_EVENTS.created, onSubscribe);
        try {
          const result = await createExpiringPromise(
            new Promise((resolve, reject) => {
              this.relayer
                .request(request)
                .catch((e) => {
                  this.logger.warn(e, e?.message);
                  reject(e);
                })
                .then(resolve);
            }),
            this.initialSubscribeTimeout,
            `Subscribing to ${topic} failed, please try again`,
          );
          this.events.removeListener(SUBSCRIBER_EVENTS.created, onSubscribe);
          resolve(result);
        } catch (err) {}
      });

      const subscribe = createExpiringPromise(
        subscribePromise,
        this.subscribeTimeout,
        `Subscribing to ${topic} failed, please try again`,
      );

      const result = await subscribe;
      if (!result && shouldThrow) {
        throw new Error(`Subscribing to ${topic} failed, please try again`);
      }
      // return null to indicate that the subscription failed
      return result ? subId : null;
    } catch (err) {
      this.logger.debug(`Outgoing Relay Subscribe Payload stalled`);
      this.relayer.events.emit(RELAYER_EVENTS.connection_stalled);
      if (shouldThrow) {
        throw err;
      }
    }
    return null;
  }

  private async rpcBatchSubscribe(subscriptions: SubscriberTypes.Params[]) {
    console.log("###?? rpcBatchSubscribe : ", new Date().toLocaleTimeString());
    if (!subscriptions.length) return;
    const relay = subscriptions[0].relay;
    const api = getRelayProtocolApi(relay!.protocol);
    const request: RequestArguments<RelayJsonRpc.BatchSubscribeParams> = {
      method: api.batchSubscribe,
      params: {
        topics: subscriptions.map((s) => s.topic),
      },
    };
    this.logger.debug(`Outgoing Relay Payload`);
    this.logger.trace({ type: "payload", direction: "outgoing", request });
    try {
      const subscribe = await createExpiringPromise(
        new Promise((resolve) => {
          this.relayer
            .request(request)
            .catch((e) => this.logger.warn(e))
            .then(resolve);
        }),
        this.subscribeTimeout,
        "rpcBatchSubscribe failed, please try again",
      );
      await subscribe;
    } catch (err) {
      this.relayer.events.emit(RELAYER_EVENTS.connection_stalled);
    }
  }

  private async rpcBatchFetchMessages(subscriptions: SubscriberTypes.Params[]) {
    console.log("###?? rpcBatchFetchMessages : ", new Date().toLocaleTimeString());
    if (!subscriptions.length) return;
    const relay = subscriptions[0].relay;
    const api = getRelayProtocolApi(relay!.protocol);
    const request: RequestArguments<RelayJsonRpc.BatchFetchMessagesParams> = {
      method: api.batchFetchMessages,
      params: {
        topics: subscriptions.map((s) => s.topic),
      },
    };
    this.logger.debug(`Outgoing Relay Payload`);
    this.logger.trace({ type: "payload", direction: "outgoing", request });
    let result;
    try {
      const fetchMessagesPromise = await createExpiringPromise(
        new Promise((resolve, reject) => {
          this.relayer
            .request(request)
            .catch((e) => {
              this.logger.warn(e);
              reject(e);
            })
            .then(resolve);
        }),
        this.subscribeTimeout,
        "rpcBatchFetchMessages failed, please try again",
      );
      result = (await fetchMessagesPromise) as {
        messages: RelayerTypes.MessageEvent[];
      };
    } catch (err) {
      this.relayer.events.emit(RELAYER_EVENTS.connection_stalled);
    }
    return result;
  }

  private rpcUnsubscribe(topic: string, id: string, relay: RelayerTypes.ProtocolOptions) {
    console.log("###?? rpcUnsubscribe : ", new Date().toLocaleTimeString());
    const api = getRelayProtocolApi(relay.protocol);
    const request: RequestArguments<RelayJsonRpc.UnsubscribeParams> = {
      method: api.unsubscribe,
      params: {
        topic,
        id,
      },
    };
    this.logger.debug(`Outgoing Relay Payload`);
    this.logger.trace({ type: "payload", direction: "outgoing", request });
    return this.relayer.request(request);
  }

  private onSubscribe(id: string, params: SubscriberTypes.Params) {
    console.log("###?? onSubscribe : ", new Date().toLocaleTimeString());
    this.setSubscription(id, { ...params, id });
    this.pending.delete(params.topic);
  }

  private onBatchSubscribe(subscriptions: SubscriberTypes.Active[]) {
    console.log("###?? onBatchSubscribe : ", new Date().toLocaleTimeString());
    if (!subscriptions.length) return;
    subscriptions.forEach((subscription) => {
      this.setSubscription(subscription.id, { ...subscription });
      this.pending.delete(subscription.topic);
    });
  }

  private async onUnsubscribe(topic: string, id: string, reason: ErrorResponse) {
    console.log("###?? onUnsubscribe : ", new Date().toLocaleTimeString());
    this.events.removeAllListeners(id);
    if (this.hasSubscription(id, topic)) {
      this.deleteSubscription(id, reason);
    }
    await this.relayer.messages.del(topic);
  }

  private async setRelayerSubscriptions(subscriptions: SubscriberTypes.Active[]) {
    console.log("###?? setRelayerSubscriptions : ", new Date().toLocaleTimeString());
    await this.relayer.core.storage.setItem<SubscriberTypes.Active[]>(
      this.storageKey,
      subscriptions,
    );
  }

  private async getRelayerSubscriptions() {
    console.log("###?? getRelayerSubscriptions : ", new Date().toLocaleTimeString());
    const subscriptions = await this.relayer.core.storage.getItem<SubscriberTypes.Active[]>(
      this.storageKey,
    );
    return subscriptions;
  }

  private setSubscription(id: string, subscription: SubscriberTypes.Active) {
    console.log("###?? setSubscription : ", new Date().toLocaleTimeString());
    this.logger.debug(`Setting subscription`);
    this.logger.trace({ type: "method", method: "setSubscription", id, subscription });
    this.addSubscription(id, subscription);
  }

  private addSubscription(id: string, subscription: SubscriberTypes.Active) {
    console.log("###?? addSubscription : ", new Date().toLocaleTimeString());
    this.subscriptions.set(id, { ...subscription });
    this.topicMap.set(subscription.topic, id);
    this.events.emit(SUBSCRIBER_EVENTS.created, subscription);
  }

  private getSubscription(id: string) {
    console.log("###?? getSubscription : ", new Date().toLocaleTimeString());
    this.logger.debug(`Getting subscription`);
    this.logger.trace({ type: "method", method: "getSubscription", id });
    const subscription = this.subscriptions.get(id);
    if (!subscription) {
      const { message } = getInternalError("NO_MATCHING_KEY", `${this.name}: ${id}`);
      throw new Error(message);
    }
    return subscription;
  }

  private deleteSubscription(id: string, reason: ErrorResponse) {
    console.log("###?? deleteSubscription : ", new Date().toLocaleTimeString());
    this.logger.debug(`Deleting subscription`);
    this.logger.trace({ type: "method", method: "deleteSubscription", id, reason });
    const subscription = this.getSubscription(id);
    this.subscriptions.delete(id);
    this.topicMap.delete(subscription.topic, id);
    this.events.emit(SUBSCRIBER_EVENTS.deleted, {
      ...subscription,
      reason,
    } as SubscriberEvents.Deleted);
  }

  private restart = async () => {
    console.log("###?? restart : ", new Date().toLocaleTimeString());
    await this.restore();
    await this.onRestart();
  };

  private async persist() {
    console.log("###?? persist : ", new Date().toLocaleTimeString());
    await this.setRelayerSubscriptions(this.values);
    this.events.emit(SUBSCRIBER_EVENTS.sync);
  }

  private async onRestart() {
    console.log("###?? onRestart : ", new Date().toLocaleTimeString());
    if (this.cached.length) {
      const subs = [...this.cached];
      const numOfBatches = Math.ceil(this.cached.length / this.batchSubscribeTopicsLimit);
      for (let i = 0; i < numOfBatches; i++) {
        const batch = subs.splice(0, this.batchSubscribeTopicsLimit);
        await this.batchSubscribe(batch);
      }
    }
    this.events.emit(SUBSCRIBER_EVENTS.resubscribed);
  }

  private async restore() {
    console.log("###?? restore : ", new Date().toLocaleTimeString());
    try {
      const persisted = await this.getRelayerSubscriptions();
      if (typeof persisted === "undefined") return;
      if (!persisted.length) return;
      if (this.subscriptions.size) {
        const { message } = getInternalError("RESTORE_WILL_OVERRIDE", this.name);
        this.logger.error(message);
        this.logger.error(`${this.name}: ${JSON.stringify(this.values)}`);
        throw new Error(message);
      }
      this.cached = persisted;
      this.logger.debug(`Successfully Restored subscriptions for ${this.name}`);
      this.logger.trace({ type: "method", method: "restore", subscriptions: this.values });
    } catch (e) {
      this.logger.debug(`Failed to Restore subscriptions for ${this.name}`);
      this.logger.error(e as any);
    }
  }

  private async batchSubscribe(subscriptions: SubscriberTypes.Params[]) {
    console.log("###?? batchSubscribe : ", new Date().toLocaleTimeString());
    if (!subscriptions.length) return;

    await this.rpcBatchSubscribe(subscriptions);
    this.onBatchSubscribe(
      await Promise.all(
        subscriptions.map(async (s) => {
          return { ...s, id: await this.getSubscriptionId(s.topic) };
        }),
      ),
    );
  }

  // @ts-ignore
  private async batchFetchMessages(subscriptions: SubscriberTypes.Params[]) {
    console.log("###?? batchFetchMessages : ", new Date().toLocaleTimeString());
    if (!subscriptions.length) return;
    this.logger.trace(`Fetching batch messages for ${subscriptions.length} subscriptions`);
    const response = await this.rpcBatchFetchMessages(subscriptions);
    if (response && response.messages) {
      await sleep(toMiliseconds(ONE_SECOND));
      await this.relayer.handleBatchMessageEvents(response.messages);
    }
  }

  private async onConnect() {
    console.log("###?? onConnect : ", new Date().toLocaleTimeString());
    await this.restart();
    this.reset();
  }

  private onDisconnect() {
    console.log("###?? onDisconnect : ", new Date().toLocaleTimeString());
    this.onDisable();
  }

  private checkPending = async () => {
    console.log("###?? checkPending : ", new Date().toLocaleTimeString());
    if (this.pending.size === 0 && (!this.initialized || !this.relayer.connected)) {
      return;
    }
    const pendingSubscriptions: SubscriberTypes.Params[] = [];
    this.pending.forEach((params) => {
      pendingSubscriptions.push(params);
    });

    await this.batchSubscribe(pendingSubscriptions);
  };

  private registerEventListeners = () => {
    console.log("###?? registerEventListeners : ", new Date().toLocaleTimeString());
    this.relayer.core.heartbeat.on(HEARTBEAT_EVENTS.pulse, async () => {
      await this.checkPending();
    });
    this.events.on(SUBSCRIBER_EVENTS.created, async (createdEvent: SubscriberEvents.Created) => {
      const eventName = SUBSCRIBER_EVENTS.created;
      this.logger.info(`Emitting ${eventName}`);
      this.logger.debug({ type: "event", event: eventName, data: createdEvent });
      await this.persist();
    });
    this.events.on(SUBSCRIBER_EVENTS.deleted, async (deletedEvent: SubscriberEvents.Deleted) => {
      const eventName = SUBSCRIBER_EVENTS.deleted;
      this.logger.info(`Emitting ${eventName}`);
      this.logger.debug({ type: "event", event: eventName, data: deletedEvent });
      await this.persist();
    });
  };

  private isInitialized() {
    console.log("###?? isInitialized : ", new Date().toLocaleTimeString());
    if (!this.initialized) {
      const { message } = getInternalError("NOT_INITIALIZED", this.name);
      throw new Error(message);
    }
  }

  private async restartToComplete(subscription: SubscriberTypes.Active) {
    console.log("###?? restartToComplete : ", new Date().toLocaleTimeString());
    if (!this.relayer.connected && !this.relayer.connecting) {
      this.cached.push(subscription);
      // Avoid calling transportOpen while offline; rely on network listener to reopen
      try {
        // @ts-ignore
        const online = await (async () => await import("@walletconnect/utils")).then(m => m.isOnline());
        if (!online) return;
      } catch {}
      await this.relayer.transportOpen();
    }
  }

  private async getClientId() {
    console.log("###?? getClientId : ", new Date().toLocaleTimeString());
    if (!this.clientId) {
      this.clientId = await this.relayer.core.crypto.getClientId();
    }
    return this.clientId;
  }

  private async getSubscriptionId(topic: string) {
    console.log("###?? getSubscriptionId : ", new Date().toLocaleTimeString());
    return hashMessage(topic + (await this.getClientId()));
  }
}
