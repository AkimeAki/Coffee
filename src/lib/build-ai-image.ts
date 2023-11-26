import type { AstroIntegration } from "astro";
import { loadEnv } from "vite";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getListContents, getContentsDetail } from "./microcms.ts";
import OpenAI from "openai";
import cheerio from "cheerio";
import type { Blog } from "./microcms.ts";

const env = loadEnv("", process.cwd());
const openai = new OpenAI({
	apiKey: env.VITE_OPENAPI_KEY
});

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
					if (r2Data.Contents === undefined) {
						throw new Error();
					}

					const posts = await getListContents<Blog>("blogs");
					const ids: string[] = [];
					posts.contents.forEach((post) => {
						ids.push(post.id);
					});

					const ungeneratedIds = [];

					ids.forEach((id) => {
						let generated = false;

						r2Data.Contents?.forEach((content) => {
							if (`${id}.png` === content.Key) {
								generated = true;
							}
						});

						if (!generated) {
							ungeneratedIds.push(id);
						}
					});

					logger.info("以下のIDについて画像生成を行います。");
					logger.info(ungeneratedIds.join(", "));

					logger.info("Ai画像生成中");

					for (const id of ungeneratedIds) {
						const post = await getContentsDetail<Blog>("blogs", id);
						const $ = cheerio.load(post.contents);

						const blogContent = $.text();

						const prompt = `次の文章からいくつかキーワードを抽出し、そのキーワードに沿って画像を生成してください。現実的な雰囲気でお願いします。\n\n${blogContent}`;

						const imageResponse = await openai.images.generate({
							model: "dall-e-3",
							prompt,
							n: 1,
							size: "1792x1024"
						});

						console.log(imageResponse);
					}
				} catch (e) {
					logger.error(e);
					logger.info("エラーが発生しました。");
				}
			}
		}
	};
}
