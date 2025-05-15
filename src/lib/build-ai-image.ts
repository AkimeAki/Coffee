import type { AstroIntegration } from "astro";
import { loadEnv } from "vite";
import { getListAllContents } from "./microcms.ts";
import OpenAI from "openai";
import * as cheerio from "cheerio";
import type { Blog } from "./microcms.ts";
import { createClient, createManagementClient } from "microcms-js-sdk";

const env = loadEnv("", process.cwd());
const openai = new OpenAI({
	apiKey: env.VITE_OPENAPI_KEY ?? ""
});

const managementClient = createManagementClient({
	serviceDomain: import.meta.env.VITE_MICROCMS_SERVICE_DOMAIN ?? env.VITE_MICROCMS_SERVICE_DOMAIN,
	apiKey: import.meta.env.VITE_MICROCMS_API_KEY ?? env.VITE_MICROCMS_API_KEY
});

const client = createClient({
	serviceDomain: import.meta.env.VITE_MICROCMS_SERVICE_DOMAIN ?? env.VITE_MICROCMS_SERVICE_DOMAIN,
	apiKey: import.meta.env.VITE_MICROCMS_API_KEY ?? env.VITE_MICROCMS_API_KEY
});

export default function (): AstroIntegration {
	return {
		name: "ai-image",
		hooks: {
			"astro:build:start": async ({ logger }) => {
				try {
					const posts = await getListAllContents<Blog>("blogs");

					for (const post of posts) {
						const $ = cheerio.load(post.contents);
						const blogContent = $.text();

						if (post.description === undefined || post.description === "") {
							logger.info("以下のIDについて要約生成を行います。");
							logger.info(post.id);

							logger.info("Ai要約生成中");

							const descriptionResponse = await openai.chat.completions.create({
								model: "gpt-4o-mini",
								messages: [
									{
										role: "user",
										content: `次の文章はブログ記事の本文です。内容を70文字に日本語で要約してください。文章の口調は本文に合わせてください。要約以外の内容は出力しないでください。\n\n${blogContent}`
									}
								],
								stream: false
							});

							const description = descriptionResponse.choices[0]?.message.content
								? `${descriptionResponse.choices[0]?.message.content}というお話らしいよ by AI`
								: "";

							await client.update({
								endpoint: "blogs",
								contentId: post.id,
								content: {
									description
								}
							});
						}

						if (post.eyecatch === undefined) {
							logger.info("以下のIDについて画像生成を行います。");
							logger.info(post.id);
							logger.info("Ai画像生成中");

							const prompt = `次のブログの文章からイメージできるテーマをいくつか考え、そのテーマに沿ってテキストを含めないアニメ風のイラストを作ってください。\n\n"${blogContent}"\n\n: `;

							const imageResponse = await openai.images.generate({
								model: "gpt-image-1",
								prompt,
								n: 1,
								size: "1536x1024",
								quality: "medium"
							});

							if (imageResponse.data === undefined) {
								throw new Error();
							}

							if (imageResponse.data[0] === undefined) {
								throw new Error();
							}

							const imageUrl = imageResponse.data[0].url;

							if (imageUrl === undefined) {
								throw new Error();
							}

							const res = await fetch(imageUrl);
							const blob = await res.blob();

							const { url } = await managementClient.uploadMedia({
								data: blob,
								name: "image.png"
							});

							await client.update({
								endpoint: "blogs",
								contentId: post.id,
								content: {
									eyecatch: url
								}
							});
						}
					}
				} catch (e) {
					logger.error(String(e));
					logger.info("エラーが発生しました。");
					process.exit(1);
				}
			}
		}
	};
}
