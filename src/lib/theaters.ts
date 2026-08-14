export interface TheaterConfig {
	slug: string;
	name: string;
	baseUrl: string;
}

// Adding a Squarespace-based theater here (Vogue, 4-Star) is the only change
// scrape-theater.ts needs to pick it up — no code changes required.
export const theaters: Record<string, TheaterConfig> = {
	balboa: {
		slug: "balboa",
		name: "Balboa",
		baseUrl: "https://www.balboamovies.com",
	},
	vogue: {
		slug: "vogue",
		name: "Vogue",
		baseUrl: "https://voguemovies.com",
	},
	"four-star": {
		slug: "four-star",
		name: "4-Star",
		baseUrl: "https://www.4-star-movies.com",
	},
};
