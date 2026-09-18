export type RecentSearch = {
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
};

export const saveRecentSearch = (search: RecentSearch) => {
const existing = JSON.parse(
    localStorage.getItem("recentSearches") || "[]"
);

    const updated = [
    search,
    ...existing.filter(
        (item: RecentSearch) => item.trainNumber !== search.trainNumber
    ),
    ].slice(0, 5);

    localStorage.setItem("recentSearches", JSON.stringify(updated));
};