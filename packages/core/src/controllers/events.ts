import { generateChildLogger, Logger } from "@walletconnect/logger";
import { ICore, IEventClient, EventClientTypes } from "@walletconnect/types";
import { formatUA, isTestRun, uuidv4, getAppMetadata } from "@walletconnect/utils";
import {
  CORE_STORAGE_PREFIX,
  EVENTS_CLIENT_API_URL,
  EVENTS_STORAGE_CLEANUP_INTERVAL,
  EVENTS_STORAGE_CONTEXT,
  EVENTS_STORAGE_VERSION,
  RELAYER_SDK_VERSION,
} from "../constants";
import { HEARTBEAT_EVENTS } from "@walletconnect/heartbeat";
import { fromMiliseconds } from "@walletconnect/time";

export class EventClient extends IEventClient {
  public readonly context = EVENTS_STORAGE_CONTEXT;
  private readonly storagePrefix = CORE_STORAGE_PREFIX;
  private readonly storageVersion = EVENTS_STORAGE_VERSION;
  private events = new Map<string, EventClientTypes.Event>();
  private shouldPersist = false;
  constructor(public core: ICore, public logger: Logger, telemetryEnabled = true) {
    console.log("###?? constructor : ", new Date().toLocaleTimeString());
    super(core, logger, telemetryEnabled);
    this.logger = generateChildLogger(logger, this.context);
    this.telemetryEnabled = telemetryEnabled;
    if (telemetryEnabled) {
      this.restore().then(async () => {
        await this.submit();
        this.setEventListeners();
      });
    } else {
      // overwrite any persisted events with an empty array
      this.persist();
    }
  }

  get storageKey() {
    console.log("###?? storageKey : ", new Date().toLocaleTimeString());
    return (
      this.storagePrefix + this.storageVersion + this.core.customStoragePrefix + "//" + this.context
    );
  }

  public init: IEventClient["init"] = async () => {
    console.log("###?? init : ", new Date().toLocaleTimeString());
    if (isTestRun()) return;
    try {
      const initEvent = {
        eventId: uuidv4(),
        timestamp: Date.now(),
        domain: this.getAppDomain(),
        props: {
          event: "INIT",
          type: "",
          properties: {
            client_id: await this.core.crypto.getClientId(),
            user_agent: formatUA(
              this.core.relayer.protocol,
              this.core.relayer.version,
              RELAYER_SDK_VERSION,
            ),
          },
        },
      };
      await this.sendEvent([initEvent] as unknown as EventClientTypes.Event[]);
    } catch (error) {
      this.logger.warn(error);
    }
  };

  public createEvent: IEventClient["createEvent"] = (params) => {
    console.log("###?? createEvent : ", new Date().toLocaleTimeString());
    const {
      event = "ERROR",
      type = "",
      properties: { topic, trace },
    } = params;
    const eventId = uuidv4();
    const bundleId = this.core.projectId || "";
    const timestamp = Date.now();
    const props = {
      event,
      type,
      properties: {
        topic,
        trace,
      },
    };
    const eventObj = {
      eventId,
      timestamp,
      props,
      bundleId,
      domain: this.getAppDomain(),
      ...this.setMethods(eventId),
    };
    if (this.telemetryEnabled) {
      this.events.set(eventId, eventObj);
      this.shouldPersist = true;
    }

    return eventObj;
  };

  public getEvent: IEventClient["getEvent"] = (params) => {
    console.log("###?? getEvent : ", new Date().toLocaleTimeString());
    const { eventId, topic } = params;
    if (eventId) {
      return this.events.get(eventId);
    }
    const event = Array.from(this.events.values()).find(
      (event) => event.props.properties.topic === topic,
    );

    if (!event) return;

    return {
      ...event,
      ...this.setMethods(event.eventId),
    };
  };

  public deleteEvent: IEventClient["deleteEvent"] = (params) => {
    console.log("###?? deleteEvent : ", new Date().toLocaleTimeString());
    const { eventId } = params;
    this.events.delete(eventId);
    this.shouldPersist = true;
  };

  private setEventListeners = () => {
    console.log("###?? setEventListeners : ", new Date().toLocaleTimeString());
    this.core.heartbeat.on(HEARTBEAT_EVENTS.pulse, async () => {
      if (this.shouldPersist) await this.persist();
      // cleanup events older than EVENTS_STORAGE_CLEANUP_INTERVAL
      this.events.forEach((event) => {
        if (
          fromMiliseconds(Date.now()) - fromMiliseconds(event.timestamp) >
          EVENTS_STORAGE_CLEANUP_INTERVAL
        ) {
          this.events.delete(event.eventId);
          this.shouldPersist = true;
        }
      });
    });
  };

  private setMethods = (eventId: string) => {
    console.log("###?? setMethods : ", new Date().toLocaleTimeString());
    return {
      addTrace: (trace: string) => this.addTrace(eventId, trace),
      setError: (errorType: string) => this.setError(eventId, errorType),
    };
  };

  private addTrace = (eventId: string, trace: string) => {
    console.log("###?? addTrace : ", new Date().toLocaleTimeString());
    const event = this.events.get(eventId);
    if (!event) return;
    event.props.properties.trace.push(trace);
    this.events.set(eventId, event);
    this.shouldPersist = true;
  };

  private setError = (eventId: string, errorType: string) => {
    console.log("###?? setError : ", new Date().toLocaleTimeString());
    const event = this.events.get(eventId);
    if (!event) return;
    event.props.type = errorType;
    event.timestamp = Date.now();
    this.events.set(eventId, event);
    this.shouldPersist = true;
  };

  private persist = async () => {
    console.log("###?? persist : ", new Date().toLocaleTimeString());
    await this.core.storage.setItem(this.storageKey, Array.from(this.events.values()));
    this.shouldPersist = false;
  };

  private restore = async () => {
    console.log("###?? restore : ", new Date().toLocaleTimeString());
    try {
      const events =
        (await this.core.storage.getItem<EventClientTypes.Event[]>(this.storageKey)) || [];
      if (!events.length) return;
      events.forEach((event) => {
        this.events.set(event.eventId, {
          ...event,
          ...this.setMethods(event.eventId),
        });
      });
    } catch (error) {
      this.logger.warn(error);
    }
  };

  private submit = async () => {
    console.log("###?? submit : ", new Date().toLocaleTimeString());
    if (!this.telemetryEnabled) return;

    if (this.events.size === 0) return;

    const eventsToSend: EventClientTypes.Event[] = [];
    // exclude events without type as they can be considered `in progress`
    for (const [_, event] of this.events) {
      if (event.props.type) {
        eventsToSend.push(event);
      }
    }

    if (eventsToSend.length === 0) return;

    try {
      const response = await this.sendEvent(eventsToSend);
      if (response.ok) {
        for (const event of eventsToSend) {
          this.events.delete(event.eventId);
          this.shouldPersist = true;
        }
      }
    } catch (error) {
      this.logger.warn(error);
    }
  };

  private sendEvent = async (events: EventClientTypes.Event[]) => {
    console.log("###?? sendEvent : ", new Date().toLocaleTimeString());
    // if domain isn't available, set `sp` as `desktop` so data would be extracted on api side
    const platform = this.getAppDomain() ? "" : "&sp=desktop";
    const response = await fetch(
      `${EVENTS_CLIENT_API_URL}?projectId=${this.core.projectId}&st=events_sdk&sv=js-${RELAYER_SDK_VERSION}${platform}`,
      {
        method: "POST",
        body: JSON.stringify(events),
      },
    );
    return response;
  };

  private getAppDomain = () => {
    console.log("###?? getAppDomain : ", new Date().toLocaleTimeString());
    return getAppMetadata().url;
  };
}
