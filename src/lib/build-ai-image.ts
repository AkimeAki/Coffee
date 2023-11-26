import type { AstroIntegration } from "astro";
import { loadEnv } from "vite";
import { S3Client, ListBucketsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const env = loadEnv("", process.cwd());

const S3 = new S3Client({
	region: "auto",
	endpoint: env.VITE_R2_ENDPOINT ?? "",
	credentials: {
		accessKeyId: env.VITE_R2_ACCESS_KEY_ID ?? "",
		secretAccessKey: env.VITE_R2_SECRET_ACCESS_KEY ?? ""
	}
});

export default function (): AstroIntegration {
	return {
		name: "ai-image",
		hooks: {
			"astro:build:done": async ({ logger }) => {
				logger.info("Ai画像未生成の記事を検索中");
				try {
					const r2Data = await S3.send(new ListObjectsV2Command({ Bucket: "coffee" }));
				} catch (e) {
					logger.info("R2アクセス時にエラーが発生しました。");
				}
				logger.info("Ai画像生成中");
			}
		}
	};
}
