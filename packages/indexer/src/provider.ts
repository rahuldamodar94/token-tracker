import { JsonRpcProvider } from "ethers";
import { config } from "@token-tracker/shared";

const RPC_URL = config.ALCHEMY_RPC;

const provider = new JsonRpcProvider(RPC_URL);

export default provider;
