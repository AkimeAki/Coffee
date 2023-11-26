import { createClient } from "microcms-js-sdk";
import { nullToUndefined } from "./nullToUndefined";
import { loadEnv } from "vite";
import type { MicroCMSContentId, MicroCMSDate, MicroCMSListResponse, MicroCMSQueries } from "microcms-js-sdk";

const env = loadEnv("", process.cwd());

const client = createClient({
	serviceDomain: import.meta.env.VITE_MICROCMS_SERVICE_DOMAIN ?? env.VITE_MICROCMS_SERVICE_DOMAIN,
	apiKey: import.meta.env.VITE_MICROCMS_API_KEY ?? env.VITE_MICROCMS_API_KEY
});

export interface Blog {
	title: string;
	contents: string;
}

export const getListContents = async <T>(
	apiName: string,
	queries: MicroCMSQueries = {}
): Promise<MicroCMSListResponse<T>> => {
	const response: MicroCMSListResponse<T> = { contents: [], totalCount: 0, limit: 0, offset: 0 };
	const limit = queries.limit;

	const get = async (offset: number): Promise<void> => {
		queries.offset = offset;
		if (limit !== undefined) {
			queries.limit = 10;
		}

		const result = await client.get<MicroCMSListResponse<T>>({ endpoint: apiName, queries });
		result.contents.forEach((content) => {
			response.contents.push(nullToUndefined<T & MicroCMSContentId & MicroCMSDate>(content));
		});

		response.totalCount = result.totalCount;
		response.limit = result.totalCount;

		if (result.totalCount > result.limit + result.offset && limit === undefined) {
			await get(result.limit + result.offset);
		}
	};

	await get(0);

	return response;
};

export const getContentsDetail = async <T>(
	apiName: string,
	contentId: string,
	queries: MicroCMSQueries = {}
): Promise<T & MicroCMSContentId & MicroCMSDate> => {
	const content = await client.getListDetail<T>({
		endpoint: apiName,
		contentId,
		queries
	});

	return nullToUndefined<T & MicroCMSContentId & MicroCMSDate>(content);
};
