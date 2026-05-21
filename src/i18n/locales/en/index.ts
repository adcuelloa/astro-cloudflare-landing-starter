import about from "./about.json";
import blog from "./blog.json";
import common from "./common.json";
import contact from "./contact.json";
import home from "./home.json";
import legal from "./legal.json";
import seo from "./seo.json";

export const locale = {
  common,
  home,
  blog,
  about,
  contact,
  legal,
  seo,
} as const;

export default locale;
