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
	const response = await client.get<MicroCMSListResponse<T>>({ endpoint: apiName, queries });
	return nullToUndefined<MicroCMSListResponse<T>>(response);
};

export const getListAllContents = async <T>(
	apiName: string,
	queries: MicroCMSQueries = {}
): Promise<Array<T & MicroCMSContentId & MicroCMSDate>> => {
	const response = await client.getAllContents<T>({ endpoint: apiName, queries });
	return nullToUndefined<Array<T & MicroCMSContentId & MicroCMSDate>>(response);
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
