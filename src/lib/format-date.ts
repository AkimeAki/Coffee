export const formatDate = (dateString: string): string => {
	const date = new Date(new Date(dateString).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }));
	const year = String(date.getFullYear());
	const month = String(date.getMonth() + 1);
	const day = String(date.getDate());
	return `${year}/${month}/${day}`;
};
