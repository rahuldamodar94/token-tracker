import { Worker, Job } from "bullmq";
import { Contract } from "ethers";
import { pool, config } from "@token-tracker/shared";
import provider from "./provider";
import { scoreToken } from "./spam-scorer";

const url = new URL(config.REDIS_URL);

const connection = {
  host: url.hostname,
  port: parseInt(url.port || "6379"),
};

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];

async function fetchTokenMetadata(contractAddress: string) {
  const contract = new Contract(contractAddress, ERC20_ABI, provider);

  let name: string | null = null;
  let symbol: string | null = null;
  let decimals: number | null = null;

  try {
    name = await contract.name();
  } catch {}
  try {
    symbol = await contract.symbol();
  } catch {}
  try {
    decimals = Number(await contract.decimals());
  } catch {}

  return { name, symbol, decimals };
}

const discoveryWorker = new Worker(
  "discovery-queue",
  async (job: Job) => {
    const { contractAddress, chainId, discoveredAtBlock } = job.data;

    const metadata = await fetchTokenMetadata(contractAddress);
    const { name, symbol, decimals } = metadata;

    const result = await pool.query(
      `INSERT INTO tokens (contract_address, chain_id, name, symbol, decimals, spam_score, status, discovered_at_block) VALUES(
        $1, $2, $3, $4 , $5, 0, 'pending',$6) ON CONFLICT (chain_id, contract_address) DO NOTHING RETURNING contract_address`,
      [contractAddress, chainId, name, symbol, decimals, discoveredAtBlock],
    );

    if (result.rows.length > 0) {
      console.log(
        `Discovered token: ${metadata.symbol || "unknown"} (${contractAddress}...)`,
      );
      await scoreToken(contractAddress, chainId);
    }
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 5,
      duration: 1000,
    },
  },
);

discoveryWorker.on("failed", (job, err) => {
  console.error(
    `Job ${job?.id} failed after ${job?.attemptsMade} attempts:`,
    err,
  );
});
