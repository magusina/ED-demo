import { Sankey } from "../lib/sankey.es";
import { getJSON } from "../lib/get-json.es";

const sankey = new Sankey("sankey2", "s1");
getJSON("data/slide13.json", data => {
  sankey
    .data(data)
    .draw();
});