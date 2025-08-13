import { generateChildLogger, getLoggerContext, Logger } from "@walletconnect/logger";
import { safeJsonParse, safeJsonStringify } from "@walletconnect/safe-json";
import { ICore, ICrypto, IKeyChain } from "@walletconnect/types";
import * as relayAuth from "@walletconnect/relay-auth";
import { fromString } from "uint8arrays/from-string";
import {
  decrypt,
  deriveSymKey,
  encrypt,
  generateKeyPair as generateKeyPairUtil,
  hashKey,
  getInternalError,
  generateRandomBytes32,
  validateEncoding,
  validateDecoding,
  isTypeOneEnvelope,
  isTypeTwoEnvelope,
  encodeTypeTwoEnvelope,
  decodeTypeTwoEnvelope,
  deserialize,
  decodeTypeByte,
  BASE16,
  BASE64,
} from "@walletconnect/utils";
import { toString } from "uint8arrays";

import { CRYPTO_CONTEXT, CRYPTO_CLIENT_SEED, CRYPTO_JWT_TTL } from "../constants";
import { KeyChain } from "./keychain";

export class Crypto implements ICrypto {
  public name = CRYPTO_CONTEXT;
  public keychain: ICrypto["keychain"];
  public readonly randomSessionIdentifier = generateRandomBytes32();

  private initialized = false;

  constructor(public core: ICore, public logger: Logger, keychain?: IKeyChain) {
    console.log("###?? constructor : ", new Date().toLocaleTimeString());
    this.core = core;
    this.logger = generateChildLogger(logger, this.name);
    this.keychain = keychain || new KeyChain(this.core, this.logger);
  }

  public init: ICrypto["init"] = async () => {
    console.log("###?? init : ", new Date().toLocaleTimeString());
    if (!this.initialized) {
      await this.keychain.init();
      this.initialized = true;
    }
  };

  get context() {
    console.log("###?? context : ", new Date().toLocaleTimeString());
    return getLoggerContext(this.logger);
  }

  public hasKeys: ICrypto["hasKeys"] = (tag) => {
    console.log("###?? hasKeys : ", new Date().toLocaleTimeString());
    this.isInitialized();
    return this.keychain.has(tag);
  };

  public getClientId: ICrypto["getClientId"] = async () => {
    console.log("###?? getClientId : ", new Date().toLocaleTimeString());
    this.isInitialized();
    const seed = await this.getClientSeed();
    const keyPair = relayAuth.generateKeyPair(seed);
    const clientId = relayAuth.encodeIss(keyPair.publicKey);
    return clientId;
  };

  public generateKeyPair: ICrypto["generateKeyPair"] = () => {
    console.log("###?? generateKeyPair : ", new Date().toLocaleTimeString());
    this.isInitialized();
    const keyPair = generateKeyPairUtil();
    return this.setPrivateKey(keyPair.publicKey, keyPair.privateKey);
  };

  public signJWT: ICrypto["signJWT"] = async (aud) => {
    console.log("###?? signJWT : ", new Date().toLocaleTimeString());
    this.isInitialized();
    const seed = await this.getClientSeed();
    const keyPair = relayAuth.generateKeyPair(seed);
    const sub = this.randomSessionIdentifier;
    const ttl = CRYPTO_JWT_TTL;
    const jwt = await relayAuth.signJWT(sub, aud, ttl, keyPair);
    return jwt;
  };

  public generateSharedKey: ICrypto["generateSharedKey"] = (
    selfPublicKey,
    peerPublicKey,
    overrideTopic,
  ) => {
    console.log("###?? generateSharedKey : ", new Date().toLocaleTimeString());
    this.isInitialized();
    const selfPrivateKey = this.getPrivateKey(selfPublicKey);
    const symKey = deriveSymKey(selfPrivateKey, peerPublicKey);
    return this.setSymKey(symKey, overrideTopic);
  };

  public setSymKey: ICrypto["setSymKey"] = async (symKey, overrideTopic) => {
    console.log("###?? setSymKey : ", new Date().toLocaleTimeString());
    this.isInitialized();
    const topic = overrideTopic || hashKey(symKey);
    await this.keychain.set(topic, symKey);
    return topic;
  };

  public deleteKeyPair: ICrypto["deleteKeyPair"] = async (publicKey: string) => {
    console.log("###?? deleteKeyPair : ", new Date().toLocaleTimeString());
    this.isInitialized();
    await this.keychain.del(publicKey);
  };

  public deleteSymKey: ICrypto["deleteSymKey"] = async (topic: string) => {
    console.log("###?? deleteSymKey : ", new Date().toLocaleTimeString());
    this.isInitialized();
    await this.keychain.del(topic);
  };

  public encode: ICrypto["encode"] = async (topic, payload, opts) => {
    console.log("###?? encode : ", new Date().toLocaleTimeString());
    this.isInitialized();
    const params = validateEncoding(opts);
    const message = safeJsonStringify(payload);

    if (isTypeTwoEnvelope(params)) {
      return encodeTypeTwoEnvelope(message, opts?.encoding);
    }

    if (isTypeOneEnvelope(params)) {
      const selfPublicKey = params.senderPublicKey;
      const peerPublicKey = params.receiverPublicKey;
      topic = await this.generateSharedKey(selfPublicKey, peerPublicKey);
    }
    const symKey = this.getSymKey(topic);
    const { type, senderPublicKey } = params;
    const result = encrypt({ type, symKey, message, senderPublicKey, encoding: opts?.encoding });
    return result;
  };

  public decode: ICrypto["decode"] = async (topic, encoded, opts) => {
    console.log("###?? decode : ", new Date().toLocaleTimeString());
    this.isInitialized();
    const params = validateDecoding(encoded, opts);
    if (isTypeTwoEnvelope(params)) {
      const message = decodeTypeTwoEnvelope(encoded, opts?.encoding);
      return safeJsonParse(message);
    }
    if (isTypeOneEnvelope(params)) {
      const selfPublicKey = params.receiverPublicKey;
      const peerPublicKey = params.senderPublicKey;
      topic = await this.generateSharedKey(selfPublicKey, peerPublicKey);
    }
    try {
      const symKey = this.getSymKey(topic);
      const message = decrypt({ symKey, encoded, encoding: opts?.encoding });
      const payload = safeJsonParse(message);
      return payload;
    } catch (error) {
      this.logger.error(
        `Failed to decode message from topic: '${topic}', clientId: '${await this.getClientId()}'`,
      );
      this.logger.error(error);
    }
  };

  public getPayloadType: ICrypto["getPayloadType"] = (encoded, encoding = BASE64) => {
    console.log("###?? getPayloadType : ", new Date().toLocaleTimeString());
    const deserialized = deserialize({ encoded, encoding });
    return decodeTypeByte(deserialized.type);
  };

  public getPayloadSenderPublicKey: ICrypto["getPayloadSenderPublicKey"] = (
    encoded,
    encoding = BASE64,
  ) => {
    console.log("###?? getPayloadSenderPublicKey : ", new Date().toLocaleTimeString());
    const deserialized = deserialize({ encoded, encoding });
    return deserialized.senderPublicKey
      ? toString(deserialized.senderPublicKey, BASE16)
      : undefined;
  };

  // ---------- Private ----------------------------------------------- //

  private async setPrivateKey(publicKey: string, privateKey: string): Promise<string> {
    console.log("###?? setPrivateKey : ", new Date().toLocaleTimeString());
    await this.keychain.set(publicKey, privateKey);
    return publicKey;
  }

  private getPrivateKey(publicKey: string) {
    console.log("###?? getPrivateKey : ", new Date().toLocaleTimeString());
    const privateKey = this.keychain.get(publicKey);
    return privateKey;
  }

  private async getClientSeed(): Promise<Uint8Array> {
    console.log("###?? getClientSeed : ", new Date().toLocaleTimeString());
    let seed = "";
    try {
      seed = this.keychain.get(CRYPTO_CLIENT_SEED);
    } catch {
      seed = generateRandomBytes32();
      await this.keychain.set(CRYPTO_CLIENT_SEED, seed);
    }
    return fromString(seed, "base16");
  }

  private getSymKey(topic: string) {
    console.log("###?? getSymKey : ", new Date().toLocaleTimeString());
    const symKey = this.keychain.get(topic);
    return symKey;
  }

  private isInitialized() {
    console.log("###?? isInitialized : ", new Date().toLocaleTimeString());
    if (!this.initialized) {
      const { message } = getInternalError("NOT_INITIALIZED", this.name);
      throw new Error(message);
    }
  }
}
