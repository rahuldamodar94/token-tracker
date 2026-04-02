import { JsonRpcProvider } from "ethers";
import { config } from "@token-tracker/shared";

const RPC_URL = `https://eth-mainnet.g.alchemy.com/v2/${config.ALCHEMY_API_KEY}`;

const provider = new JsonRpcProvider(RPC_URL);

export default provider;
