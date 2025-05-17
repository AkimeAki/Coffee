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

						// if (post.description === undefined || post.description === "") {
						// 	logger.info(`AI要約生成中 ID: ${post.id}`);

						// 	const descriptionResponse = await openai.chat.completions.create({
						// 		model: "gpt-4.1-mini",
						// 		messages: [
						// 			{
						// 				role: "user",
						// 				content: `次の文章はブログ記事の本文です。内容を70文字に日本語で要約して、「というお話らしいよ by AI」で締めくくってください。\n\n${blogContent}`
						// 			}
						// 		],
						// 		stream: false
						// 	});

						// 	const description = descriptionResponse.choices[0]?.message.content
						// 		? descriptionResponse.choices[0]?.message.content
						// 		: "";

						// 	logger.info("AI要約生成完了");
						// 	logger.info("microCMSに要約を設定中");

						// 	await client.update({
						// 		endpoint: "blogs",
						// 		contentId: post.id,
						// 		content: {
						// 			description
						// 		}
						// 	});

						// 	logger.info("microCMSに要約を設定完了");
						// }

						if (post.eyecatch === undefined) {
							logger.info(post.id);
							logger.info(`AI画像生成中 ID: ${post.id}`);

							const prompt = `次のブログの文章を元に、この内容の概念を表した幻想的で美しいイラストを作ってください。テキストは含めず、透過部分も無しで作成してください。\n\n"${blogContent}"\n\n: `;

							const imageResponse = await openai.images.generate({
								model: "gpt-image-1",
								prompt,
								n: 1,
								size: "1536x1024",
								quality: "medium"
							});

							const imageBase64 = imageResponse.data?.[0]?.b64_json;

							if (imageBase64 === undefined) {
								throw new Error();
							}

							const imageBytes = Buffer.from(imageBase64, "base64");

							const blob = new Blob([imageBytes], { type: "image/png" });

							logger.info("AI画像の生成完了");
							logger.info("microCMSにアップロード中");

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

							logger.info("microCMSにアップロード完了");
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
