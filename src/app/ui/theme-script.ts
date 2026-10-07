export const THEME_STORAGE_KEY = "theme";

// Runs in <head> before the page paints, so a saved choice never flashes the
// other theme first. Dark is the default. Kept apart from the theme hooks so
// the server layout can import it.
export const themeScript = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="light")document.documentElement.dataset.theme="light"}catch(e){}`;
