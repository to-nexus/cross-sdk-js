import { AuthTypes } from "@walletconnect/types";
import { describe, expect, it } from "vitest";
import { isValidEip191Signature, verifySignature } from "../src";

describe("utils/signature", () => {
  describe("EIP-1271 signatures", () => {
    const chainId = "eip155:1";
    const projectId = process.env.TEST_PROJECT_ID!;
    const address = "0x2faf83c542b68f1b4cdc0e770e8cb9f567b08f71";
    const reconstructedMessage = `localhost wants you to sign in with your Ethereum account:
0x2faf83c542b68f1b4cdc0e770e8cb9f567b08f71

URI: http://localhost:3000/
Version: 1
Chain ID: 1
Nonce: 1665443015700
Issued At: 2022-10-10T23:03:35.700Z
Expiration Time: 2022-10-11T23:03:35.700Z`;

    it("passes for a valid signature", async () => {
      const cacaoSignature: AuthTypes.CacaoSignature = {
        t: "eip1271",
        s: "0xc1505719b2504095116db01baaf276361efd3a73c28cf8cc28dabefa945b8d536011289ac0a3b048600c1e692ff173ca944246cf7ceb319ac2262d27b395c82b1c",
      };

      const isValid = await verifySignature(
        address,
        reconstructedMessage,
        cacaoSignature,
        chainId,
        projectId,
      );
      expect(isValid).to.be.true;
    });
    it("fails for a bad signature", async () => {
      const cacaoSignature: AuthTypes.CacaoSignature = {
        t: "eip1271",
        s: "0xdead5719b2504095116db01baaf276361efd3a73c28cf8cc28dabefa945b8d536011289ac0a3b048600c1e692ff173ca944246cf7ceb319ac2262d27b395c82b1c",
      };

      const isValid = await verifySignature(
        address,
        reconstructedMessage,
        cacaoSignature,
        chainId,
        projectId,
      );
      expect(isValid).toBe(false);
    });
    it("fails for a bad chainid", async () => {
      const cacaoSignature: AuthTypes.CacaoSignature = {
        t: "eip1271",
        s: "0xdead5719b2504095116db01baaf276361efd3a73c28cf8cc28dabefa945b8d536011289ac0a3b048600c1e692ff173ca944246cf7ceb319ac2262d27b395c82b1c",
      };
      const invalidChainIdOne = "1";
      await expect(
        verifySignature(
          address,
          reconstructedMessage,
          cacaoSignature,
          invalidChainIdOne,
          projectId,
        ),
      ).rejects.toThrow(
        `isValidEip1271Signature failed: chainId must be in CAIP-2 format, received: ${invalidChainIdOne}`,
      );
      const invalidChainIdTwo = ":1";
      await expect(
        verifySignature(
          address,
          reconstructedMessage,
          cacaoSignature,
          invalidChainIdTwo,
          projectId,
        ),
      ).rejects.toThrow(
        `isValidEip1271Signature failed: chainId must be in CAIP-2 format, received: ${invalidChainIdTwo}`,
      );
      const invalidChainIdThree = "1:";
      await expect(
        verifySignature(
          address,
          reconstructedMessage,
          cacaoSignature,
          invalidChainIdThree,
          projectId,
        ),
      ).rejects.toThrow(
        `isValidEip1271Signature failed: chainId must be in CAIP-2 format, received: ${invalidChainIdThree}`,
      );
    });
  });
  describe("EIP-191 signatures", () => {
    it("should validate a valid signature", async () => {
      const address = "0x13A2Ff792037AA2cd77fE1f4B522921ac59a9C52";
      const message = `Hello AppKit!`;
      const signature =
        "0xd7ec09eb8ecb1ba9af45380e14d3ef1a1ec2376e0adfc0a9b591e7c3519a00d702cbe063aa55ff681265eed2d1646a217f0bf23f12ab4cd326455ab4134e12691b";
      const isValid = await isValidEip191Signature(address, message, signature);
      expect(isValid).toBe(true);
    });
    it("should fail to validate an invalid signature", async () => {
      const address = "0x13A2Ff792037AA2cd77fE1f4B522921ac59a9C52";
      const message = `Hello AppKit!`;
      const signature = "0xd7ec09eb8ecb1ba9af45380e14d3ef1a1ec2376e0adfc0a9b591e";
      await expect(isValidEip191Signature(address, message, signature)).rejects.toThrow();
    });
    it("should fail to validate a valid signature with wrong address", async () => {
      const address = "0x13A2Ff792037AA2cd77fE1f4B522921ac59a9C54";
      const message = `Hello AppKit!`;
      const signature = "0xd7ec09eb8ecb1ba9af45380e14d3ef1a1ec2376e0adfc0a9b591e";
      await expect(isValidEip191Signature(address, message, signature)).rejects.toThrow();
    });
    it("should fail to validate an valid signature with wrong message", async () => {
      const address = "0x13A2Ff792037AA2cd77fE1f4B522921ac59a9C52";
      const message = `Hello AppKit! 0xyadayada`;
      const signature = "0xd7ec09eb8ecb1ba9af45380e14d3ef1a1ec2376e0adfc0a9b591e";
      await expect(isValidEip191Signature(address, message, signature)).rejects.toThrow();
    });
  });
});
